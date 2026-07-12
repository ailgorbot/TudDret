"use client";

import { useState, useTransition } from "react";
import { createDay } from "@/lib/actions";
import { Sheet, fieldClass, labelClass } from "./Sheet";

export function DayDialog({
  tripId,
  open,
  onClose,
}: {
  tripId: number;
  open: boolean;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createDay(formData);
      if (result.ok) {
        onClose();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <Sheet open={open} title="Ajouter une journée" onClose={onClose}>
      <form action={handleSubmit} className="flex flex-col gap-4 pb-2">
        <input type="hidden" name="tripId" value={tripId} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="day-date" className={labelClass}>
              Date *
            </label>
            <input id="day-date" name="date" type="date" required className={fieldClass} />
          </div>
          <div>
            <label htmlFor="day-island" className={labelClass}>
              Île
            </label>
            <input
              id="day-island"
              name="island"
              placeholder="Santo Antão"
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="day-title" className={labelClass}>
            Titre de la journée
          </label>
          <input
            id="day-title"
            name="title"
            placeholder="Les vallées luxuriantes"
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="day-notes" className={labelClass}>
            Notes
          </label>
          <textarea
            id="day-notes"
            name="notes"
            rows={3}
            className={`${fieldClass} min-h-20 py-2.5`}
          />
        </div>

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
            {isPending ? "Création…" : "Créer la journée"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
