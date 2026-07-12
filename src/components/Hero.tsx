"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { TripDTO } from "@/lib/types";
import { formatCve, formatDayLabel, formatEuro } from "@/lib/format";
import { WeatherCard } from "./WeatherCard";

const LANDSCAPES = [
  { src: "/hero/praia.webp", title: "Praia, Santiago" },
  { src: "/hero/buracona.webp", title: "Buracona, Sal" },
  { src: "/hero/pedra-lume.webp", title: "Pedra de Lume, Sal" },
  { src: "/hero/viana.webp", title: "Désert de Viana, Boa Vista" },
  { src: "/hero/fogo.webp", title: "Pico do Fogo" },
  { src: "/hero/serra-malagueta.webp", title: "Serra Malagueta, Santiago" },
];

const SLIDESHOW_INTERVAL_MS = 12_000;

export function Hero({
  trip,
  estimatedBudget,
  spentTotal,
}: {
  trip: TripDTO;
  estimatedBudget: number;
  spentTotal: number;
}) {
  // Démarre sur une photo qui dépend du jour, comme le site d'origine.
  const [index, setIndex] = useState(() => new Date().getDate() % LANDSCAPES.length);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % LANDSCAPES.length),
      SLIDESHOW_INTERVAL_MS,
    );
    return () => clearInterval(timer);
  }, [paused]);

  const landscape = LANDSCAPES[index];

  return (
    <section
      aria-label="Paysages du Cap-Vert et repères du voyage"
      className="relative overflow-hidden rounded-3xl bg-ocean-950 text-white shadow-float"
    >
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          key={landscape.src}
          src={landscape.src}
          alt=""
          fill
          sizes="(min-width: 1152px) 1152px, 100vw"
          className="hero-photo-enter object-cover opacity-70"
          priority={index === new Date().getDate() % LANDSCAPES.length}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ocean-950/60 via-ocean-950/30 to-ocean-950/85" />
      </div>

      <div className="relative flex flex-col gap-6 px-5 pb-5 pt-14 sm:px-8 sm:pt-20 lg:px-12">
        <div className="max-w-xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-star-400">
            {trip.name} · {formatDayLabel(trip.startDate)} → {formatDayLabel(trip.endDate)}
          </p>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
            Votre voyage,
            <br />
            <em className="text-star-400">au rythme des îles.</em>
          </h1>
          <p className="mt-3 max-w-md text-white/85 sm:text-lg">
            De Sal à Fogo, rassemblez chaque traversée, chaque adresse et chaque
            détour dans un itinéraire clair.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/15 bg-ocean-900/70 p-4 backdrop-blur-sm sm:p-5">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-star-400 font-display text-lg font-bold text-ocean-950"
              >
                €
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                  Budget estimé
                </p>
                <p className="font-display text-2xl sm:text-3xl">
                  {formatEuro(estimatedBudget)}
                </p>
              </div>
            </div>
            <dl className="mt-3 space-y-1 text-sm text-white/75">
              <div className="flex justify-between gap-4">
                <dt>En escudos</dt>
                <dd className="font-medium text-star-400">
                  {formatCve(estimatedBudget, trip.exchangeRateCve)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Déjà dépensé</dt>
                <dd className="font-medium">{formatEuro(spentTotal)}</dd>
              </div>
              <div className="flex justify-between gap-4 text-xs text-white/50">
                <dt>Taux</dt>
                <dd>1 € = {trip.exchangeRateCve.toLocaleString("fr-FR")} CVE</dd>
              </div>
            </dl>
          </div>

          <WeatherCard />
        </div>

        <div className="flex items-center justify-between gap-3 text-sm text-white/80">
          <span className="inline-flex items-center gap-1.5 truncate">
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current" aria-hidden="true">
              <path d="M12 22s-7-5.7-7-11.5a7 7 0 1 1 14 0C19 16.3 12 22 12 22Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
            </svg>
            <strong className="truncate font-medium">{landscape.title}</strong>
          </span>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5" role="tablist" aria-label="Choisir un paysage">
              {LANDSCAPES.map((item, i) => (
                <button
                  key={item.src}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={item.title}
                  onClick={() => setIndex(i)}
                  className={`h-2.5 w-2.5 rounded-full transition ${
                    i === index ? "bg-star-400" : "bg-white/35 hover:bg-white/60"
                  }`}
                  style={{ minWidth: "10px" }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              aria-label={paused ? "Reprendre le diaporama" : "Mettre le diaporama en pause"}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 transition hover:bg-white/20"
            >
              {paused ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                  <path d="M8 5.5v13l11-6.5L8 5.5Z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                  <path d="M7 5h3.5v14H7V5Zm6.5 0H17v14h-3.5V5Z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
