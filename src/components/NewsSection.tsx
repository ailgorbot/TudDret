"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { LinkIcon } from "./icons";

type NewsItem = { title: string; link: string; pubDate: string };

const CARD_IMAGES = [
  { url: "/hero/praia.webp", alt: "Vue de Praia au Cap-Vert" },
  { url: "/hero/viana.webp", alt: "Désert de Viana à Boa Vista" },
  { url: "/hero/fogo.webp", alt: "Pico do Fogo au Cap-Vert" },
  { url: "/hero/buracona.webp", alt: "Côte de Buracona sur l'île de Sal" },
];

export function NewsSection() {
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [statusLabel, setStatusLabel] = useState("Actualisation…");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/news")
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return;
        setItems(payload.items);
        setStatusLabel(
          payload.live
            ? `${payload.items.length} nouvelles · mises à jour à ${new Date(
                payload.updatedAt,
              ).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
            : "Sélection TV5MONDE disponible",
        );
      })
      .catch(() => {
        if (!cancelled) setStatusLabel("Actualités indisponibles");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section aria-labelledby="news-title" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral-600">
            Le Cap-Vert aujourd&apos;hui
          </p>
          <h2 id="news-title" className="font-display text-3xl text-ocean-900 sm:text-4xl">
            Les dernières nouvelles des îles
          </h2>
        </div>
        <div className="flex flex-col items-start gap-1 text-sm sm:items-end">
          <span className="text-ocean-900/55">{statusLabel}</span>
          <a
            href="https://information.tv5monde.com/pays/cap-vert"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 font-medium text-ocean-700 hover:underline"
          >
            Toute l&apos;actualité sur TV5MONDE
            <LinkIcon className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div
        className="scroll-fade -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:px-0 lg:grid-cols-4"
        aria-live="polite"
      >
        {(items ?? Array.from({ length: 4 }, () => null)).map((item, index) => {
          const image = CARD_IMAGES[index % CARD_IMAGES.length];
          if (!item) {
            return (
              <div
                key={index}
                className="h-64 w-72 shrink-0 snap-start animate-pulse rounded-2xl bg-sand-100 sm:w-auto"
              />
            );
          }
          return (
            <a
              key={item.link + index}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-72 shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-float sm:w-auto"
            >
              <div className="relative h-32">
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="288px"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <time dateTime={item.pubDate} className="text-xs font-semibold uppercase tracking-wider text-coral-600">
                  {new Date(item.pubDate).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                <h3 className="line-clamp-3 font-semibold leading-snug text-ocean-950">
                  {item.title}
                </h3>
                <small className="mt-auto text-ocean-900/50">
                  TV5MONDE · Lire l&apos;article ↗
                </small>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
