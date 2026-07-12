// Importe l'itinéraire Cap-Vert 2026 depuis le backup Grist du site d'origine.
// Idempotent : ne fait rien si un voyage existe déjà.
// Utilisable en local (node scripts/seed.mjs) comme dans l'image Docker.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

try {
  const { config } = await import("dotenv");
  config();
} catch {
  /* production : pas de dotenv */
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL manquante : impossible de seeder.");
  process.exit(1);
}

const FRENCH_MONTHS = {
  janvier: "01", février: "02", mars: "03", avril: "04", mai: "05", juin: "06",
  juillet: "07", août: "08", septembre: "09", octobre: "10", novembre: "11", décembre: "12",
};

/** "jeudi 5 novembre 2026" -> "2026-11-05" */
function parseFrenchDate(value) {
  const match = value.trim().match(/(\d{1,2})\s+([a-zûé]+)\s+(\d{4})/i);
  if (!match) throw new Error(`Date illisible : "${value}"`);
  const month = FRENCH_MONTHS[match[2].toLowerCase()];
  if (!month) throw new Error(`Mois inconnu : "${match[2]}"`);
  return `${match[3]}-${month}-${match[1].padStart(2, "0")}`;
}

function inferType(description) {
  const d = description.toLowerCase();
  if (d.startsWith("vol")) return "flight";
  if (d.includes("ferry")) return "ferry";
  if (d.includes("logement")) return "lodging";
  if (d.includes("voiture")) return "car";
  if (d.includes("randonnée")) return "hike";
  if (d.includes("plage")) return "beach";
  if (d.includes("fin du voyage")) return "transport";
  return "visit";
}

const MANDATORY_TYPES = new Set(["flight", "ferry", "lodging", "car"]);

function inferIsland(lieu) {
  const l = lieu.toUpperCase();
  if (l.includes("SAL")) return "Sal";
  if (l.includes("BOA VISTA")) return "Boa Vista";
  if (l.includes("FOGO")) return "Fogo";
  if (l.includes("PRAIA")) return "Santiago";
  return null;
}

function parseJsonField(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

const backupPath = fileURLToPath(new URL("./seed-data/grist-backup.json", import.meta.url));
// replace() retire l'éventuel BOM UTF-8 en tête de fichier.
const backup = JSON.parse(readFileSync(backupPath, "utf-8").replace(/^﻿/, ""));
const records = backup.records.filter((record) => !record.fields.Deleted);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

try {
  const existing = await pool.query("SELECT id FROM trips LIMIT 1");
  if (existing.rowCount > 0) {
    console.log("Un voyage existe déjà, seed ignoré.");
    process.exit(0);
  }

  const dates = records.map((record) => parseFrenchDate(record.fields.Date)).sort();

  const tripResult = await pool.query(
    `INSERT INTO trips (name, slug, start_date, end_date, currency, persons)
     VALUES ($1, $2, $3, $4, 'EUR', 2) RETURNING id`,
    ["Cap-Vert 2026", "cap-vert-2026", dates[0], dates[dates.length - 1]],
  );
  const tripId = tripResult.rows[0].id;

  const byDate = new Map();
  for (const record of records) {
    const iso = parseFrenchDate(record.fields.Date);
    if (!byDate.has(iso)) byDate.set(iso, []);
    byDate.get(iso).push(record);
  }

  let activityCount = 0;
  for (const [iso, group] of [...byDate.entries()].sort()) {
    const islands = group
      .map((record) => inferIsland(record.fields.Lieu))
      .filter(Boolean);
    const island = islands.length > 0 ? islands[islands.length - 1] : null;

    const dayResult = await pool.query(
      "INSERT INTO days (trip_id, date, island) VALUES ($1, $2, $3) RETURNING id",
      [tripId, iso, island],
    );
    const dayId = dayResult.rows[0].id;

    let position = 0;
    for (const record of group) {
      const f = record.fields;
      const type = inferType(f.Description);
      await pool.query(
        `INSERT INTO activities
           (day_id, title, type, is_mandatory, duration, cost, cost_shared, location,
            booking_url, source_url, notes, images, practical_info, sub_activities,
            place_description, ferry_schedule, position)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          dayId,
          f.Description,
          type,
          MANDATORY_TYPES.has(type),
          f.Duree || null,
          f.Cout_seul ?? null,
          f.Partager ?? false,
          f.Lieu || null,
          f.BookingURL || null,
          f.SourceURL || null,
          f.Commentaires || null,
          JSON.stringify(parseJsonField(f.ImagesJSON, [])),
          f.PracticalInfo ? JSON.stringify(parseJsonField(f.PracticalInfo, null)) : null,
          JSON.stringify(parseJsonField(f.ActivitiesJSON, [])),
          f.PlaceDescription || null,
          f.FerrySchedule || null,
          position++,
        ],
      );
      activityCount++;
    }
  }

  await pool.query(
    `INSERT INTO user_config (key, value) VALUES ('offline_mode', '{"enabled": false}')
     ON CONFLICT (key) DO NOTHING`,
  );

  console.log(`Seed terminé : ${byDate.size} journées, ${activityCount} activités.`);
} catch (error) {
  console.error("Échec du seed :", error);
  process.exit(1);
} finally {
  await pool.end();
}
