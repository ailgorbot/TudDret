import { asc } from "drizzle-orm";
import { db } from "@/db";
import { days, type Activity, type Day, type Trip } from "@/db/schema";

export type DayWithActivities = Day & { activities: Activity[] };
export type TripData = {
  trip: Trip;
  days: DayWithActivities[];
  estimatedBudget: number;
};

/**
 * Charge le voyage courant avec ses journées et activités triées.
 * Retourne null si la base est vide (premier lancement).
 */
export async function getTripData(): Promise<TripData | null> {
  const trip = await db.query.trips.findFirst();
  if (!trip) return null;

  const tripDays = await db.query.days.findMany({
    where: (table, { eq }) => eq(table.tripId, trip.id),
    orderBy: [asc(days.date)],
    with: {
      activities: {
        orderBy: (table, { asc: ascFn }) => [ascFn(table.position), ascFn(table.id)],
      },
    },
  });

  const estimatedBudget = tripDays
    .flatMap((day) => day.activities)
    .reduce((total, activity) => {
      if (activity.cost == null) return total;
      const cost = Number(activity.cost);
      if (Number.isNaN(cost)) return total;
      // Coût par personne sauf dépense partagée (une seule fois pour le groupe).
      return total + (activity.costShared ? cost : cost * trip.persons);
    }, 0);

  return { trip, days: tripDays, estimatedBudget };
}
