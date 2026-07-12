"use server";

import { revalidatePath } from "next/cache";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  activities,
  activityTypeEnum,
  days,
  expenses,
  trips,
  userConfig,
  type ActivityType,
} from "@/db/schema";

export type ActionResult = { ok: true } | { ok: false; error: string };

function fail(error: string): ActionResult {
  return { ok: false, error };
}

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requireText(formData: FormData, key: string): string {
  const value = text(formData, key);
  if (!value) throw new Error(`Champ requis manquant : ${key}`);
  return value;
}

function parseActivityType(value: string | null): ActivityType {
  const candidates = activityTypeEnum.enumValues;
  return candidates.includes(value as ActivityType) ? (value as ActivityType) : "visit";
}

function parseCost(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return parsed.toFixed(2);
}

function parseTime(value: string | null): string | null {
  if (!value) return null;
  return /^\d{2}:\d{2}(:\d{2})?$/.test(value) ? value : null;
}

function parseIsoDate(value: string | null): string | null {
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

// ---------------------------------------------------------------------------
// Journées
// ---------------------------------------------------------------------------

export async function createDay(formData: FormData): Promise<ActionResult> {
  try {
    const tripId = Number(requireText(formData, "tripId"));
    const date = parseIsoDate(text(formData, "date"));
    if (!date) return fail("Date invalide.");

    await db
      .insert(days)
      .values({
        tripId,
        date,
        island: text(formData, "island"),
        title: text(formData, "title"),
        notes: text(formData, "notes"),
      })
      .onConflictDoNothing();

    // Étend la période du voyage si besoin.
    await db
      .update(trips)
      .set({
        startDate: sql`least(${trips.startDate}, ${date}::date)`,
        endDate: sql`greatest(${trips.endDate}, ${date}::date)`,
        updatedAt: sql`now()`,
      })
      .where(eq(trips.id, tripId));

    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("createDay:", error);
    return fail("Impossible de créer la journée.");
  }
}

export async function updateDay(formData: FormData): Promise<ActionResult> {
  try {
    const id = Number(requireText(formData, "id"));
    await db
      .update(days)
      .set({
        island: text(formData, "island"),
        title: text(formData, "title"),
        notes: text(formData, "notes"),
        updatedAt: sql`now()`,
      })
      .where(eq(days.id, id));
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("updateDay:", error);
    return fail("Impossible de modifier la journée.");
  }
}

export async function deleteDay(formData: FormData): Promise<ActionResult> {
  try {
    const id = Number(requireText(formData, "id"));
    await db.delete(days).where(eq(days.id, id));
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("deleteDay:", error);
    return fail("Impossible de supprimer la journée.");
  }
}

/**
 * Réordonne les journées par glisser-déposer. Les dates sont des ancres fixes :
 * on déplace la journée glissée à la position de la cible et toutes les
 * journées intermédiaires se décalent d'un cran (rotation), chaque journée
 * emportant ses activités intactes. Concrètement, on redistribue la séquence
 * de dates entre les journées réordonnées.
 */
export async function reorderDays(formData: FormData): Promise<ActionResult> {
  try {
    const tripId = Number(requireText(formData, "tripId"));
    const draggedId = Number(requireText(formData, "draggedId"));
    const targetId = Number(requireText(formData, "targetId"));
    if (draggedId === targetId) return { ok: true };

    await db.transaction(async (tx) => {
      const ordered = await tx
        .select({ id: days.id, date: days.date })
        .from(days)
        .where(eq(days.tripId, tripId))
        .orderBy(asc(days.date));

      const fromIndex = ordered.findIndex((d) => d.id === draggedId);
      const toIndex = ordered.findIndex((d) => d.id === targetId);
      if (fromIndex === -1 || toIndex === -1) {
        throw new Error("Journée introuvable pour le réordonnancement.");
      }

      // Séquence de dates dans l'ordre calendaire : ce sont les ancres fixes.
      const dates = ordered.map((d) => d.date);

      // Déplace la journée glissée à la position cible ; le reste se décale.
      const reordered = [...ordered];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);

      // Passe 1 : parque toutes les dates loin dans le futur pour ne pas
      // heurter l'index unique (trip_id, date) pendant la réaffectation.
      await tx
        .update(days)
        .set({ date: sql`(${days.date} + interval '1000 years')::date` })
        .where(eq(days.tripId, tripId));

      // Passe 2 : réaffecte à chaque journée sa nouvelle date d'ancrage.
      for (let i = 0; i < reordered.length; i++) {
        await tx
          .update(days)
          .set({ date: dates[i], updatedAt: sql`now()` })
          .where(eq(days.id, reordered[i].id));
      }
    });

    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("reorderDays:", error);
    return fail("Impossible de réordonner les journées.");
  }
}

// ---------------------------------------------------------------------------
// Activités
// ---------------------------------------------------------------------------

function activityValuesFromForm(formData: FormData) {
  const constraintsRaw = text(formData, "constraints");
  return {
    title: requireText(formData, "title"),
    type: parseActivityType(text(formData, "type")),
    isMandatory: formData.get("isMandatory") === "on",
    isOptional: formData.get("isOptional") === "on",
    startTime: parseTime(text(formData, "startTime")),
    endTime: parseTime(text(formData, "endTime")),
    cost: parseCost(text(formData, "cost")),
    costShared: formData.get("costShared") === "on",
    location: text(formData, "location"),
    contact: text(formData, "contact"),
    bookingUrl: text(formData, "bookingUrl"),
    notes: text(formData, "notes"),
    constraints: constraintsRaw
      ? constraintsRaw.split(",").map((item) => item.trim()).filter(Boolean)
      : [],
  };
}

export async function createActivity(formData: FormData): Promise<ActionResult> {
  try {
    const dayId = Number(requireText(formData, "dayId"));
    const [{ max }] = await db
      .select({ max: sql<number>`coalesce(max(${activities.position}), -1)` })
      .from(activities)
      .where(eq(activities.dayId, dayId));

    await db.insert(activities).values({
      dayId,
      ...activityValuesFromForm(formData),
      position: Number(max) + 1,
    });
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("createActivity:", error);
    return fail("Impossible de créer l'activité.");
  }
}

export async function updateActivity(formData: FormData): Promise<ActionResult> {
  try {
    const id = Number(requireText(formData, "id"));
    await db
      .update(activities)
      .set({ ...activityValuesFromForm(formData), updatedAt: sql`now()` })
      .where(eq(activities.id, id));
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("updateActivity:", error);
    return fail("Impossible de modifier l'activité.");
  }
}

export async function deleteActivity(formData: FormData): Promise<ActionResult> {
  try {
    const id = Number(requireText(formData, "id"));
    await db.delete(activities).where(eq(activities.id, id));
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("deleteActivity:", error);
    return fail("Impossible de supprimer l'activité.");
  }
}

// ---------------------------------------------------------------------------
// Dépenses
// ---------------------------------------------------------------------------

export async function createExpense(formData: FormData): Promise<ActionResult> {
  try {
    const tripId = Number(requireText(formData, "tripId"));
    const amount = parseCost(text(formData, "amount"));
    if (!amount) return fail("Montant invalide.");

    await db.insert(expenses).values({
      tripId,
      label: requireText(formData, "label"),
      amount,
      paidBy: text(formData, "paidBy"),
      incurredOn: parseIsoDate(text(formData, "incurredOn")),
      notes: text(formData, "notes"),
    });
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("createExpense:", error);
    return fail("Impossible d'enregistrer la dépense.");
  }
}

export async function deleteExpense(formData: FormData): Promise<ActionResult> {
  try {
    const id = Number(requireText(formData, "id"));
    await db.delete(expenses).where(eq(expenses.id, id));
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("deleteExpense:", error);
    return fail("Impossible de supprimer la dépense.");
  }
}

// ---------------------------------------------------------------------------
// Préférences
// ---------------------------------------------------------------------------

export async function setUserConfig(key: string, value: unknown): Promise<ActionResult> {
  try {
    await db
      .insert(userConfig)
      .values({ key, value })
      .onConflictDoUpdate({
        target: userConfig.key,
        set: { value, updatedAt: sql`now()` },
      });
    return { ok: true };
  } catch (error) {
    console.error("setUserConfig:", error);
    return fail("Impossible d'enregistrer la préférence.");
  }
}
