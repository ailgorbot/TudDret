"use client";

import { useState, useTransition } from "react";
import { createExpense, deleteExpense } from "@/lib/actions";
import type { TripDTO } from "@/lib/types";
import { formatCve, formatEuro, formatShortDate } from "@/lib/format";
import { Sheet, fieldClass, labelClass } from "./Sheet";
import { PlusIcon, TrashIcon } from "./icons";

export type ExpenseDTO = {
  id: number;
  label: string;
  amount: number;
  paidBy: string | null;
  incurredOn: string | null;
  notes: string | null;
};

export function ExpensesSection({
  trip,
  expenses,
}: {
  trip: TripDTO;
  expenses: ExpenseDTO[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createExpense(formData);
      if (result.ok) {
        setDialogOpen(false);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <section aria-labelledby="expenses-title" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral-600">
            Situation financière
          </p>
          <h2 id="expenses-title" className="font-display text-3xl text-ocean-900 sm:text-4xl">
            Les dépenses du groupe
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="flex min-h-12 items-center gap-2 rounded-full border-2 border-ocean-700 px-5 font-semibold text-ocean-700 transition hover:bg-ocean-50 active:scale-[0.98]"
        >
          <PlusIcon className="h-5 w-5" />
          Ajouter une dépense
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-sand-100 bg-ocean-700 px-5 py-4 text-white">
          <span className="text-sm font-semibold uppercase tracking-wider text-white/70">
            Total dépensé
          </span>
          <span>
            <strong className="font-display text-2xl">{formatEuro(total)}</strong>
            <span className="ml-2 text-sm text-star-400">
              {formatCve(total, trip.exchangeRateCve)}
            </span>
          </span>
        </div>

        {expenses.length === 0 ? (
          <p className="px-5 py-8 text-center text-ocean-900/55">
            Aucune dépense enregistrée pour l&apos;instant. Les dépenses saisies ici
            remplacent le suivi Sesterce de l&apos;ancienne version.
          </p>
        ) : (
          <ul className="divide-y divide-sand-100">
            {expenses.map((expense) => (
              <li key={expense.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ocean-950">{expense.label}</p>
                  <p className="text-sm text-ocean-900/60">
                    {[
                      expense.incurredOn ? formatShortDate(expense.incurredOn) : null,
                      expense.paidBy ? `payé par ${expense.paidBy}` : null,
                      expense.notes,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <span className="font-semibold text-ocean-700">
                  {formatEuro(expense.amount)}
                </span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      const formData = new FormData();
                      formData.set("id", String(expense.id));
                      await deleteExpense(formData);
                    })
                  }
                  aria-label={`Supprimer la dépense « ${expense.label} »`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ocean-900/40 transition hover:bg-coral-100 hover:text-coral-700 disabled:opacity-50"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Sheet open={dialogOpen} title="Ajouter une dépense" onClose={() => setDialogOpen(false)}>
        <form action={handleSubmit} className="flex flex-col gap-4 pb-2">
          <input type="hidden" name="tripId" value={trip.id} />

          <div>
            <label htmlFor="expense-label" className={labelClass}>
              Libellé *
            </label>
            <input
              id="expense-label"
              name="label"
              required
              placeholder="Dîner à Mindelo"
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="expense-amount" className={labelClass}>
                Montant (€) *
              </label>
              <input
                id="expense-amount"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                required
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="expense-date" className={labelClass}>
                Date
              </label>
              <input id="expense-date" name="incurredOn" type="date" className={fieldClass} />
            </div>
          </div>

          <div>
            <label htmlFor="expense-paidby" className={labelClass}>
              Payé par
            </label>
            <input id="expense-paidby" name="paidBy" placeholder="Émile" className={fieldClass} />
          </div>

          <div>
            <label htmlFor="expense-notes" className={labelClass}>
              Notes
            </label>
            <textarea
              id="expense-notes"
              name="notes"
              rows={2}
              className={`${fieldClass} min-h-16 py-2.5`}
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
              onClick={() => setDialogOpen(false)}
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
    </section>
  );
}
