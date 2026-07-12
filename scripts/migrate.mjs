// Applique les migrations SQL du dossier ./drizzle.
// Réimplémente le migrateur drizzle-orm avec pg seul (même table de journal,
// même hachage) : l'image Docker standalone ne contient pas drizzle-orm.
// Utilisable en local (node scripts/migrate.mjs) comme dans l'image Docker.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

// dotenv est une dépendance de dev : absente en production, les variables
// viennent alors de l'environnement (Coolify).
try {
  const { config } = await import("dotenv");
  config();
} catch {
  /* production : pas de dotenv */
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL manquante : impossible de migrer.");
  process.exit(1);
}

const migrationsDir = new URL("../drizzle/", import.meta.url);
const journal = JSON.parse(
  readFileSync(fileURLToPath(new URL("meta/_journal.json", migrationsDir)), "utf-8"),
);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const client = await pool.connect();

try {
  console.log("Application des migrations…");
  await client.query("CREATE SCHEMA IF NOT EXISTS drizzle");
  await client.query(
    `CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
       id SERIAL PRIMARY KEY,
       hash text NOT NULL,
       created_at bigint
     )`,
  );

  const { rows } = await client.query(
    "SELECT created_at FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 1",
  );
  const lastAppliedAt = rows.length > 0 ? Number(rows[0].created_at) : 0;

  let applied = 0;
  for (const entry of [...journal.entries].sort((a, b) => a.idx - b.idx)) {
    if (entry.when <= lastAppliedAt) continue;

    const sql = readFileSync(
      fileURLToPath(new URL(`${entry.tag}.sql`, migrationsDir)),
      "utf-8",
    );
    const hash = createHash("sha256").update(sql).digest("hex");
    const statements = sql
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);

    await client.query("BEGIN");
    try {
      for (const statement of statements) {
        await client.query(statement);
      }
      await client.query(
        "INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)",
        [hash, entry.when],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
    console.log(`  ✓ ${entry.tag}`);
    applied++;
  }

  console.log(
    applied > 0
      ? `Migrations appliquées (${applied}).`
      : "Base déjà à jour, aucune migration à appliquer.",
  );
} catch (error) {
  console.error("Échec des migrations :", error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
