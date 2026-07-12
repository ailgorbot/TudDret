"use client";

import { useState, useTransition } from "react";
import type { ActivityDTO, DayDTO } from "@/lib/types";
import { deleteDay } from "@/lib/actions";
import { formatDayLabel } from "@/lib/format";
import { ActivityRow } from "./ActivityRow";
import { ChevronIcon, GripIcon, PlusIcon, TrashIcon } from "./icons";

const ISLAND_COLORS: Record<string, string> = {
  Sal: "bg-star-100 text-star-600",
  "Boa Vista": "bg-coral-100 text-coral-700",
  Santiago: "bg-ocean-100 text-ocean-700",
  Fogo: "bg-palm-100 text-palm-700",
};

export function DayCard({
  day,
  dayNumber,
  defaultOpen,
  onAddActivity,
  onEditActivity,
  reorderable = false,
  isDragging = false,
  isDropTarget = false,
  onDragStartCard,
  onDragEnterCard,
  onDropCard,
  onDragEndCard,
}: {
  day: DayDTO;
  dayNumber: number;
  defaultOpen: boolean;
  onAddActivity: () => void;
  onEditActivity: (activity: ActivityDTO) => void;
  reorderable?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onDragStartCard?: () => void;
  onDragEnterCard?: () => void;
  onDropCard?: () => void;
  onDragEndCard?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const mandatoryCount = day.activities.filter((a) => a.isMandatory).length;
  const islandBadge = day.island
    ? (ISLAND_COLORS[day.island] ?? "bg-sand-100 text-sand-700")
    : null;

  return (
    <li
      draggable={reorderable}
      onDragStart={
        reorderable
          ? (event) => {
              event.dataTransfer.effectAllowed = "move";
              onDragStartCard?.();
            }
          : undefined
      }
      onDragEnter={reorderable ? () => onDragEnterCard?.() : undefined}
      onDragOver={reorderable ? (event) => event.preventDefault() : undefined}
      onDrop={
        reorderable
          ? (event) => {
              event.preventDefault();
              onDropCard?.();
            }
          : undefined
      }
      onDragEnd={reorderable ? () => onDragEndCard?.() : undefined}
      className={`flex flex-col overflow-hidden rounded-2xl bg-white shadow-card transition ${
        isDragging ? "opacity-40" : ""
      } ${
        isDropTarget ? "ring-2 ring-ocean-500 ring-offset-2" : ""
      } ${reorderable ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-sand-50"
      >
        <div className="flex items-center gap-3">
          {reorderable && (
            <GripIcon className="h-5 w-5 shrink-0 text-ocean-900/25" />
          )}
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ocean-700 font-display text-lg font-bold text-white"
          >
            {dayNumber}
          </span>
          <div>
            <p className="font-semibold capitalize text-ocean-950">
              {formatDayLabel(day.date)}
            </p>
            <p className="flex flex-wrap items-center gap-2 text-sm text-ocean-900/60">
              {day.island && islandBadge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${islandBadge}`}
                >
                  {day.island}
                </span>
              )}
              <span>
                {day.activities.length} activité{day.activities.length > 1 ? "s" : ""}
                {mandatoryCount > 0 && ` · ${mandatoryCount} impérative${mandatoryCount > 1 ? "s" : ""}`}
              </span>
            </p>
          </div>
        </div>
        <ChevronIcon
          className={`h-5 w-5 shrink-0 text-ocean-900/40 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="flex flex-col border-t border-sand-100">
          {day.title && (
            <p className="px-4 pt-3 font-display text-lg text-ocean-900">{day.title}</p>
          )}
          {day.notes && (
            <p className="px-4 pt-2 text-sm text-ocean-900/70">{day.notes}</p>
          )}

          {day.activities.length === 0 ? (
            <p className="px-4 py-4 text-sm text-ocean-900/50">
              Aucune activité pour cette journée.
            </p>
          ) : (
            <ul className="divide-y divide-sand-100">
              {day.activities.map((activity) => (
                <ActivityRow
                  key={activity.id}
                  activity={activity}
                  onEdit={() => onEditActivity(activity)}
                />
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between gap-2 border-t border-sand-100 px-3 py-2">
            <button
              type="button"
              onClick={onAddActivity}
              className="flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold text-ocean-700 transition hover:bg-ocean-50"
            >
              <PlusIcon className="h-4 w-4" />
              Ajouter une activité
            </button>

            {confirmingDelete ? (
              <span className="flex items-center gap-1.5 text-sm">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      const formData = new FormData();
                      formData.set("id", String(day.id));
                      await deleteDay(formData);
                    })
                  }
                  className="min-h-11 rounded-full bg-coral-600 px-3.5 font-semibold text-white transition hover:bg-coral-700 disabled:opacity-50"
                >
                  {isPending ? "Suppression…" : "Confirmer"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="min-h-11 rounded-full px-3 text-ocean-900/60 hover:bg-sand-100"
                >
                  Annuler
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                aria-label={`Supprimer la journée du ${formatDayLabel(day.date)}`}
                className="flex h-11 w-11 items-center justify-center rounded-full text-ocean-900/40 transition hover:bg-coral-100 hover:text-coral-700"
              >
                <TrashIcon className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
