"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
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
