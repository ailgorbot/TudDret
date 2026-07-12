"use client";

import { useState, useTransition } from "react";
import { createActivity, updateActivity } from "@/lib/actions";
import { ACTIVITY_TYPE_LABELS } from "@/lib/types";
import type { ActivityDialogState } from "./Timeline";
import { Sheet, fieldClass, labelClass } from "./Sheet";

export function ActivityDialog({
  state,
  onClose,
}: {
  state: ActivityDialogState;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (state.mode === "closed") return null;

  const activity = state.mode === "edit" ? state.activity : null;

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = activity
        ? await updateActivity(formData)
        : await createActivity(formData);
      if (result.ok) {
        onClose();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <Sheet
      open
      title={activity ? "Modifier l'activité" : "Ajouter une activité"}
      onClose={onClose}
    >
      <form action={handleSubmit} className="flex flex-col gap-4 pb-2">
        {activity ? (
          <input type="hidden" name="id" value={activity.id} />
        ) : (
          <input type="hidden" name="dayId" value={state.mode === "create" ? state.dayId : ""} />
        )}

        <div>
          <label htmlFor="activity-title" className={labelClass}>
            Titre *
          </label>
          <input
            id="activity-title"
            name="title"
            required
            defaultValue={activity?.title ?? ""}
            placeholder="Ex. Ferry pour Santo Antão"
            className={fieldClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="activity-type" className={labelClass}>
              Type
            </label>
            <select
              id="activity-type"
              name="type"
              defaultValue={activity?.type ?? "visit"}
              className={fieldClass}
            >
              {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="activity-cost" className={labelClass}>
              Coût par personne (€)
            </label>
            <input
              id="activity-cost"
              name="cost"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              defaultValue={activity?.cost ?? ""}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="activity-start" className={labelClass}>
              Début
            </label>
            <input
              id="activity-start"
              name="startTime"
              type="time"
              defaultValue={activity?.startTime?.slice(0, 5) ?? ""}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="activity-end" className={labelClass}>
              Fin
            </label>
            <input
              id="activity-end"
              name="endTime"
              type="time"
              defaultValue={activity?.endTime?.slice(0, 5) ?? ""}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="activity-location" className={labelClass}>
            Lieu / adresse
          </label>
          <input
            id="activity-location"
            name="location"
            defaultValue={activity?.location ?? ""}
            placeholder="Mindelo, São Vicente"
            className={fieldClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="activity-contact" className={labelClass}>
              Contact
            </label>
            <input
              id="activity-contact"
              name="contact"
              defaultValue={activity?.contact ?? ""}
              placeholder="+238…"
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="activity-booking" className={labelClass}>
              Lien de réservation
            </label>
            <input
              id="activity-booking"
              name="bookingUrl"
              type="url"
              defaultValue={activity?.bookingUrl ?? ""}
              placeholder="https://"
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="activity-constraints" className={labelClass}>
            Contraintes
          </label>
          <input
            id="activity-constraints"
            name="constraints"
            defaultValue={activity?.constraints.join(", ") ?? ""}
            placeholder="Réservation obligatoire, chaussures de marche"
            className={fieldClass}
          />
          <p className="mt-1 text-xs text-ocean-900/50">
            Séparez les contraintes par des virgules.
          </p>
        </div>

        <div>
          <label htmlFor="activity-notes" className={labelClass}>
            Notes et détails
          </label>
          <textarea
            id="activity-notes"
            name="notes"
            rows={4}
            defaultValue={activity?.notes ?? ""}
            className={`${fieldClass} min-h-24 py-2.5`}
          />
        </div>

        <fieldset className="flex flex-wrap gap-x-6 gap-y-2">
          <legend className="sr-only">Statut de l&apos;activité</legend>
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-medium text-ocean-900">
            <input
              type="checkbox"
              name="isMandatory"
              defaultChecked={activity?.isMandatory ?? false}
              className="h-5 w-5 rounded accent-ocean-700"
            />
            Étape impérative
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-medium text-ocean-900">
            <input
              type="checkbox"
              name="isOptional"
              defaultChecked={activity?.isOptional ?? false}
              className="h-5 w-5 rounded accent-ocean-700"
            />
            Activité optionnelle
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-medium text-ocean-900">
            <input
              type="checkbox"
              name="costShared"
              defaultChecked={activity?.costShared ?? false}
              className="h-5 w-5 rounded accent-ocean-700"
            />
            Coût partagé (groupe)
          </label>
        </fieldset>

        {error && (
          <p role="alert" className="rounded-xl bg-coral-100 px-4 py-3 text-sm font-medium text-coral-700">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 flex-1 rounded-full border border-sand-300 font-semibold text-ocean-900 transition hover:bg-sand-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="min-h-12 flex-1 rounded-full bg-ocean-700 font-semibold text-white transition hover:bg-ocean-800 disabled:opacity-60"
          >
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
