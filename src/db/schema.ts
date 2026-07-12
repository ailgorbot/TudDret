import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  time,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const activityTypeEnum = pgEnum("activity_type", [
  "flight",
  "ferry",
  "lodging",
  "car",
  "visit",
  "meal",
  "transport",
  "beach",
  "hike",
  "option",
]);

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  currency: text("currency").notNull().default("EUR"),
  // Enveloppe budgétaire cible ; le budget estimé est calculé depuis les activités.
  totalBudget: numeric("total_budget", { precision: 10, scale: 2 }),
  persons: integer("persons").notNull().default(2),
  // Taux fixe EUR -> CVE (escudo indexé sur l'euro).
  exchangeRateCve: numeric("exchange_rate_cve", { precision: 10, scale: 3 })
    .notNull()
    .default("110.265"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const days = pgTable(
  "days",
  {
    id: serial("id").primaryKey(),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    island: text("island"),
    title: text("title"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("days_trip_date_idx").on(table.tripId, table.date)],
);

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  dayId: integer("day_id")
    .notNull()
    .references(() => days.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: activityTypeEnum("type").notNull().default("visit"),
  isMandatory: boolean("is_mandatory").notNull().default(false),
  isOptional: boolean("is_optional").notNull().default(false),
  startTime: time("start_time"),
  endTime: time("end_time"),
  duration: text("duration"),
  // Coût par personne, dans la devise du voyage.
  cost: numeric("cost", { precision: 10, scale: 2 }),
  costShared: boolean("cost_shared").notNull().default(false),
  location: text("location"),
  contact: text("contact"),
  bookingUrl: text("booking_url"),
  sourceUrl: text("source_url"),
  notes: text("notes"),
  constraints: jsonb("constraints").$type<string[]>().notNull().default([]),
  images: jsonb("images")
    .$type<{ url: string; alt: string; credit?: string; source?: string }[]>()
    .notNull()
    .default([]),
  practicalInfo: jsonb("practical_info").$type<{
    access?: string;
    duration?: string;
    difficulty?: string;
    equipment?: string;
    advice?: string;
  }>(),
  subActivities: jsonb("sub_activities")
    .$type<{ name: string; description?: string; cost?: string; status?: string }[]>()
    .notNull()
    .default([]),
  placeDescription: text("place_description"),
  ferrySchedule: text("ferry_schedule"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  activityId: integer("activity_id").references(() => activities.id, {
    onDelete: "set null",
  }),
  label: text("label").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("EUR"),
  paidBy: text("paid_by"),
  splitMode: text("split_mode").notNull().default("equal"),
  incurredOn: date("incurred_on", { mode: "string" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Préférences applicatives clé/valeur (mode local, filtres mémorisés, etc.).
export const userConfig = pgTable("user_config", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tripsRelations = relations(trips, ({ many }) => ({
  days: many(days),
  expenses: many(expenses),
}));

export const daysRelations = relations(days, ({ one, many }) => ({
  trip: one(trips, { fields: [days.tripId], references: [trips.id] }),
  activities: many(activities),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  day: one(days, { fields: [activities.dayId], references: [days.id] }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  trip: one(trips, { fields: [expenses.tripId], references: [trips.id] }),
  activity: one(activities, {
    fields: [expenses.activityId],
    references: [activities.id],
  }),
}));

export type Trip = typeof trips.$inferSelect;
export type Day = typeof days.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type ActivityType = (typeof activityTypeEnum.enumValues)[number];
