"use client";

import { useEffect, useRef } from "react";
import { CloseIcon } from "./icons";

/**
 * Panneau modal mobile-first : bottom sheet sur smartphone,
 * boîte de dialogue centrée à partir de la tablette.
 */
export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("input, select, textarea")?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-ocean-950/50 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        className="sheet-enter relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-float sm:max-w-xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-sand-100 px-5 py-4">
          <h3 className="font-display text-xl text-ocean-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-11 w-11 items-center justify-center rounded-full text-ocean-900/50 transition hover:bg-sand-100"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export const fieldClass =
  "w-full min-h-12 rounded-xl border border-sand-300 bg-white px-3.5 text-ocean-950 placeholder:text-ocean-900/35 focus:border-ocean-500";

export const labelClass = "mb-1.5 block text-sm font-semibold text-ocean-900";
