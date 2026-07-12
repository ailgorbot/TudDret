import Image from "next/image";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { expenses as expensesTable } from "@/db/schema";
import { getTripData } from "@/lib/queries";
import type { ActivityDTO, DayDTO, TripDTO } from "@/lib/types";
import { Hero } from "@/components/Hero";
import { Timeline } from "@/components/Timeline";
import { NewsSection } from "@/components/NewsSection";
import { ExpensesSection } from "@/components/ExpensesSection";

export const dynamic = "force-dynamic";

export default async function Home() {
  let data: Awaited<ReturnType<typeof getTripData>> = null;
  let offline = false;

  try {
    data = await getTripData();
  } catch (error) {
    console.error("Base de données injoignable :", error);
    offline = true;
  }

  if (offline) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <span className="rounded-full bg-star-100 px-4 py-1.5 text-sm font-semibold text-star-600">
          Mode local
        </span>
        <h1 className="font-display text-3xl text-ocean-900">
          Les îles sont hors de portée
        </h1>
        <p className="text-ocean-900/70">
          La base de données est injoignable pour le moment. Vos données sont en
          sécurité — rechargez la page dans quelques instants.
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="font-display text-3xl text-ocean-900">Bem-vindo !</h1>
        <p className="text-ocean-900/70">
          Aucun voyage n&apos;est encore configuré. Lancez{" "}
          <code className="rounded bg-sand-100 px-1.5 py-0.5 text-sm">npm run db:seed</code>{" "}
          pour importer l&apos;itinéraire Cap-Vert 2026.
        </p>
      </main>
    );
  }

  const trip: TripDTO = {
    id: data.trip.id,
    name: data.trip.name,
    startDate: data.trip.startDate,
    endDate: data.trip.endDate,
    currency: data.trip.currency,
    persons: data.trip.persons,
    exchangeRateCve: Number(data.trip.exchangeRateCve),
    totalBudget: data.trip.totalBudget ? Number(data.trip.totalBudget) : null,
  };

  const tripDays: DayDTO[] = data.days.map((day) => ({
    id: day.id,
    date: day.date,
    island: day.island,
    title: day.title,
    notes: day.notes,
    activities: day.activities.map(
      (activity): ActivityDTO => ({
        id: activity.id,
        dayId: activity.dayId,
        title: activity.title,
        type: activity.type,
        isMandatory: activity.isMandatory,
        isOptional: activity.isOptional,
        startTime: activity.startTime,
        endTime: activity.endTime,
        duration: activity.duration,
        cost: activity.cost != null ? Number(activity.cost) : null,
        costShared: activity.costShared,
        location: activity.location,
        contact: activity.contact,
        bookingUrl: activity.bookingUrl,
        sourceUrl: activity.sourceUrl,
        notes: activity.notes,
        constraints: activity.constraints,
        images: activity.images,
        practicalInfo: activity.practicalInfo,
        subActivities: activity.subActivities,
        placeDescription: activity.placeDescription,
        ferrySchedule: activity.ferrySchedule,
      }),
    ),
  }));

  const tripExpenses = await db
    .select()
    .from(expensesTable)
    .orderBy(asc(expensesTable.incurredOn), asc(expensesTable.id));

  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a href="#" className="flex items-center gap-2" aria-label="TudDret — haut de page">
          <Image
            src="/brand/cabo-verde-logo.png"
            alt="The Islands of Cabo Verde — From the Heart"
            width={198}
            height={72}
            className="h-15 w-auto sm:h-18"
            priority
          />
        </a>
        <span
          className="flex min-h-11 items-center gap-2 rounded-full border border-palm-700/20 bg-palm-100 px-3.5 text-sm font-medium text-palm-700"
          title="Données synchronisées avec PostgreSQL"
        >
          <span className="h-2 w-2 rounded-full bg-palm-700" aria-hidden="true" />
          Base connectée
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 pb-16 sm:px-6 lg:gap-14">
        <Hero
          trip={trip}
          estimatedBudget={data.estimatedBudget}
          spentTotal={tripExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)}
        />
        <Timeline trip={trip} days={tripDays} />
        <ExpensesSection
          trip={trip}
          expenses={tripExpenses.map((expense) => ({
            id: expense.id,
            label: expense.label,
            amount: Number(expense.amount),
            paidBy: expense.paidBy,
            incurredOn: expense.incurredOn,
            notes: expense.notes,
          }))}
        />
        <NewsSection />
      </main>
    </>
  );
}
