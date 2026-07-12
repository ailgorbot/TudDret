"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import type { ActivityDTO } from "@/lib/types";
import { ACTIVITY_TYPE_LABELS } from "@/lib/types";
import { deleteActivity } from "@/lib/actions";
import { formatEuro, formatTime } from "@/lib/format";
import {
  ActivityTypeIcon,
  ChevronIcon,
  ClockIcon,
  LinkIcon,
  PencilIcon,
  PinIcon,
  StarIcon,
  TrashIcon,
} from "./icons";

const TYPE_STYLES: Record<string, string> = {
  flight: "bg-ocean-100 text-ocean-700",
  ferry: "bg-ocean-100 text-ocean-700",
  lodging: "bg-palm-100 text-palm-700",
  car: "bg-sand-100 text-sand-700",
  hike: "bg-palm-100 text-palm-700",
  beach: "bg-star-100 text-star-600",
  option: "bg-star-100 text-star-600",
};

export function ActivityRow({
  activity,
  onEdit,
}: {
  activity: ActivityDTO;
  onEdit: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasDetails = Boolean(
    activity.notes ||
      activity.placeDescription ||
      activity.images.length > 0 ||
      activity.practicalInfo ||
      activity.subActivities.length > 0 ||
      activity.constraints.length > 0 ||
      activity.bookingUrl ||
      activity.contact,
  );

  const timeLabel = [formatTime(activity.startTime), formatTime(activity.endTime)]
    .filter(Boolean)
    .join(" → ");

  return (
    <li className="px-4 py-3">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            TYPE_STYLES[activity.type] ?? "bg-coral-100 text-coral-700"
          }`}
        >
          <ActivityTypeIcon type={activity.type} className="h-4.5 w-4.5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-ocean-950">
              {activity.title}
              {activity.isMandatory && (
                <span
                  className="ml-1.5 inline-flex align-text-top text-star-500"
                  title="Étape impérative"
                >
                  <StarIcon className="h-4 w-4" />
                  <span className="sr-only">(impératif)</span>
                </span>
              )}
            </p>
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={onEdit}
                aria-label={`Modifier « ${activity.title} »`}
                className="flex h-11 w-11 items-center justify-center rounded-full text-ocean-900/40 transition hover:bg-ocean-50 hover:text-ocean-700"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              {confirmingDelete ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      const formData = new FormData();
                      formData.set("id", String(activity.id));
                      await deleteActivity(formData);
                    })
                  }
                  className="min-h-11 rounded-full bg-coral-600 px-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isPending ? "…" : "Confirmer"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  aria-label={`Supprimer « ${activity.title} »`}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-ocean-900/40 transition hover:bg-coral-100 hover:text-coral-700"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ocean-900/65">
            <span className="rounded-full bg-sand-100 px-2 py-0.5 text-xs font-medium">
              {ACTIVITY_TYPE_LABELS[activity.type]}
              {activity.isOptional && " · optionnel"}
            </span>
            {timeLabel && (
              <span className="inline-flex items-center gap-1">
                <ClockIcon className="h-3.5 w-3.5" />
                {timeLabel}
              </span>
            )}
            {activity.duration && !timeLabel && (
              <span className="inline-flex items-center gap-1">
                <ClockIcon className="h-3.5 w-3.5" />
                {activity.duration}
              </span>
            )}
            {activity.location && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <PinIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{activity.location}</span>
              </span>
            )}
            {activity.cost != null && (
              <span className="font-semibold text-ocean-700">
                {formatEuro(activity.cost)}
                <span className="font-normal text-ocean-900/55">
                  {activity.costShared ? " (groupe)" : " / pers."}
                </span>
              </span>
            )}
          </div>

          {hasDetails && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
              className="mt-1.5 flex min-h-11 items-center gap-1 text-sm font-medium text-ocean-700 hover:underline"
            >
              {expanded ? "Masquer les détails" : "Voir les détails"}
              <ChevronIcon
                className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          )}

          {expanded && (
            <div className="mt-2 flex flex-col gap-3 rounded-xl bg-sand-50 p-3 text-sm text-ocean-900/80">
              {activity.placeDescription && <p>{activity.placeDescription}</p>}
              {activity.notes && <p className="whitespace-pre-wrap">{activity.notes}</p>}

              {activity.images.length > 0 && (
                <div className="scroll-fade -mx-1 flex gap-2 overflow-x-auto px-1">
                  {activity.images.map((image) => (
                    <figure key={image.url} className="w-40 shrink-0 sm:w-48">
                      <div className="relative h-28 overflow-hidden rounded-lg sm:h-32">
                        <Image
                          src={image.url}
                          alt={image.alt}
                          fill
                          sizes="192px"
                          className="object-cover"
                        />
                      </div>
                      {image.credit && (
                        <figcaption className="mt-1 truncate text-xs text-ocean-900/50">
                          {image.credit}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              )}

              {activity.practicalInfo && (
                <dl className="grid gap-1.5">
                  {(
                    [
                      ["access", "Accès"],
                      ["duration", "Durée"],
                      ["difficulty", "Difficulté"],
                      ["equipment", "Matériel"],
                      ["advice", "Conseil"],
                    ] as const
                  ).map(([key, label]) =>
                    activity.practicalInfo?.[key] ? (
                      <div key={key}>
                        <dt className="inline font-semibold text-ocean-900">{label} : </dt>
                        <dd className="inline">{activity.practicalInfo[key]}</dd>
                      </div>
                    ) : null,
                  )}
                </dl>
              )}

              {activity.subActivities.length > 0 && (
                <ul className="grid gap-1.5">
                  {activity.subActivities.map((sub) => (
                    <li key={sub.name} className="flex gap-2">
                      <span aria-hidden="true" className="text-coral-500">
                        ◆
                      </span>
                      <span>
                        <strong className="text-ocean-900">{sub.name}</strong>
                        {sub.description && ` — ${sub.description}`}
                        {sub.cost && (
                          <em className="text-ocean-900/60"> ({sub.cost})</em>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {activity.constraints.length > 0 && (
                <p>
                  <strong className="text-ocean-900">Contraintes : </strong>
                  {activity.constraints.join(", ")}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                {activity.contact && (
                  <span>
                    <strong className="text-ocean-900">Contact : </strong>
                    {activity.contact}
                  </span>
                )}
                {activity.bookingUrl && (
                  <a
                    href={activity.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-ocean-700 hover:underline"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    Réserver
                  </a>
                )}
                {activity.sourceUrl && (
                  <a
                    href={activity.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-ocean-700 hover:underline"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    En savoir plus
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
