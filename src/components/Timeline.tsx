"use client";

import { useMemo, useState, useTransition } from "react";
import type { ActivityType } from "@/db/schema";
import type { ActivityDTO, DayDTO, TripDTO } from "@/lib/types";
import { reorderDays } from "@/lib/actions";
import { todayIso } from "@/lib/format";
import { DayCard } from "./DayCard";
import { ActivityDialog } from "./ActivityDialog";
import { DayDialog } from "./DayDialog";
import { PlaneIcon, FerryIcon, HouseIcon, CarIcon, PlusIcon, GripIcon } from "./icons";

type DateFilter = "today" | "tomorrow" | "after-tomorrow" | "all";
type TypeFilter = "all" | Extract<ActivityType, "flight" | "ferry" | "lodging" | "car">;

const DATE_FILTERS: { id: DateFilter; label: string }[] = [
  { id: "today", label: "Aujourd'hui" },
  { id: "tomorrow", label: "Demain" },
  { id: "after-tomorrow", label: "Après-demain" },
  { id: "all", label: "Tout" },
];

const TYPE_FILTERS: { id: TypeFilter; label: string; icon: React.ReactNode }[] = [
  { id: "flight", label: "Vol", icon: <PlaneIcon className="h-4 w-4" /> },
  { id: "ferry", label: "Ferry", icon: <FerryIcon className="h-4 w-4" /> },
  { id: "lodging", label: "Logement", icon: <HouseIcon className="h-4 w-4" /> },
  { id: "car", label: "Voiture", icon: <CarIcon className="h-4 w-4" /> },
];

export type ActivityDialogState =
  | { mode: "closed" }
  | { mode: "create"; dayId: number }
  | { mode: "edit"; activity: ActivityDTO };

export function Timeline({ trip, days }: { trip: TripDTO; days: DayDTO[] }) {
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [activityDialog, setActivityDialog] = useState<ActivityDialogState>({
    mode: "closed",
  });
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);
  const [, startReorder] = useTransition();

  // Le réordonnancement n'a de sens que sur la liste complète, dans l'ordre
  // calendaire (sans filtre de date ni de type).
  const reorderable = dateFilter === "all" && typeFilter === "all";

  function endDrag() {
    setDraggingId(null);
    setDropTargetId(null);
  }

  function handleDrop(targetId: number) {
    const draggedId = draggingId;
    endDrag();
    if (draggedId == null || draggedId === targetId) return;
    startReorder(async () => {
      const formData = new FormData();
      formData.set("tripId", String(trip.id));
      formData.set("draggedId", String(draggedId));
      formData.set("targetId", String(targetId));
      await reorderDays(formData);
    });
  }

  const visibleDays = useMemo(() => {
    let result = days;
    if (dateFilter !== "all") {
      const offset =
        dateFilter === "today" ? 0 : dateFilter === "tomorrow" ? 1 : 2;
      const target = todayIso(offset);
      result = result.filter((day) => day.date === target);
    }
    if (typeFilter !== "all") {
      result = result
        .map((day) => ({
          ...day,
          activities: day.activities.filter((activity) => activity.type === typeFilter),
        }))
        .filter((day) => day.activities.length > 0);
    }
    return result;
  }, [days, dateFilter, typeFilter]);

  return (
    <section aria-labelledby="timeline-title" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral-600">
            Vue d&apos;ensemble
          </p>
          <h2 id="timeline-title" className="font-display text-3xl text-ocean-900 sm:text-4xl">
            Le voyage en un coup d&apos;œil
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setDayDialogOpen(true)}
          className="flex min-h-12 items-center gap-2 rounded-full bg-ocean-700 px-5 font-semibold text-white shadow-card transition hover:bg-ocean-800 active:scale-[0.98]"
        >
          <PlusIcon className="h-5 w-5" />
          Ajouter une journée
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div
          role="group"
          aria-label="Filtrer par date"
          className="scroll-fade -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0"
        >
          {DATE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              aria-pressed={dateFilter === filter.id}
              onClick={() => setDateFilter(filter.id)}
              className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition ${
                dateFilter === filter.id
                  ? "border-ocean-700 bg-ocean-700 text-white"
                  : "border-sand-300 bg-white text-ocean-900 hover:border-ocean-500"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div
          role="group"
          aria-label="Filtrer par type d'activité"
          className="scroll-fade -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0"
        >
          <button
            type="button"
            aria-pressed={typeFilter === "all"}
            onClick={() => setTypeFilter("all")}
            className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition ${
              typeFilter === "all"
                ? "border-coral-600 bg-coral-600 text-white"
                : "border-sand-300 bg-white text-ocean-900 hover:border-coral-500"
            }`}
          >
            Toutes les activités
          </button>
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              aria-pressed={typeFilter === filter.id}
              onClick={() =>
                setTypeFilter((current) => (current === filter.id ? "all" : filter.id))
              }
              className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition ${
                typeFilter === filter.id
                  ? "border-coral-600 bg-coral-600 text-white"
                  : "border-sand-300 bg-white text-ocean-900 hover:border-coral-500"
              }`}
            >
              {filter.icon}
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {reorderable && visibleDays.length > 1 && (
        <p className="flex items-center gap-1.5 text-sm text-ocean-900/50">
          <GripIcon className="h-4 w-4 shrink-0" />
          Glissez-déposez une journée pour la replacer : les journées entre les
          deux se décalent d&apos;un cran, activités comprises.
        </p>
      )}

      {visibleDays.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand-300 bg-white px-6 py-12 text-center text-ocean-900/60">
          {dateFilter !== "all" ? (
            <p>
              Rien de prévu pour cette date — le départ est fixé au{" "}
              <strong className="text-ocean-900">5 novembre 2026</strong>.
            </p>
          ) : (
            <p>Aucune activité ne correspond à ce filtre.</p>
          )}
        </div>
      ) : (
        <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleDays.map((day, index) => (
            <DayCard
              key={day.id}
              day={day}
              dayNumber={days.findIndex((d) => d.id === day.id) + 1}
              defaultOpen={index === 0 && visibleDays.length <= 3}
              onAddActivity={() => setActivityDialog({ mode: "create", dayId: day.id })}
              onEditActivity={(activity) =>
                setActivityDialog({ mode: "edit", activity })
              }
              reorderable={reorderable}
              isDragging={draggingId === day.id}
              isDropTarget={dropTargetId === day.id && draggingId !== day.id}
              onDragStartCard={() => setDraggingId(day.id)}
              onDragEnterCard={() => setDropTargetId(day.id)}
              onDropCard={() => handleDrop(day.id)}
              onDragEndCard={endDrag}
            />
          ))}
        </ol>
      )}

      <ActivityDialog
        state={activityDialog}
        onClose={() => setActivityDialog({ mode: "closed" })}
      />
      <DayDialog
        tripId={trip.id}
        open={dayDialogOpen}
        onClose={() => setDayDialogOpen(false)}
      />
    </section>
  );
}
