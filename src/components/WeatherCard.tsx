"use client";

import { useEffect, useState } from "react";
import { weatherIcon, SunIcon } from "./icons";

type Reading = {
  id: string;
  name: string;
  today: { temperature: number; code: number };
  tomorrow: { temperature: number; code: number };
};

export function WeatherCard() {
  const [readings, setReadings] = useState<Reading[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/weather")
      .then(async (response) => {
        if (!response.ok) throw new Error("Météo indisponible");
        return response.json();
      })
      .then((payload) => {
        if (cancelled) return;
        setReadings(payload.readings);
        setUpdatedAt(
          new Date(payload.updatedAt).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-2xl border border-white/15 bg-ocean-900/70 p-4 backdrop-blur-sm sm:p-5">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-star-400 text-ocean-950"
        >
          <SunIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Météo aujourd&apos;hui et demain
          </p>
          <p className="text-sm text-white/75">
            {status === "loading" && "Actualisation…"}
            {status === "ready" && `Mis à jour à ${updatedAt}`}
            {status === "error" && "Données météo indisponibles"}
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {(readings ?? [{ id: "sal", name: "Sal" }, { id: "boavista", name: "Boa Vista" }, { id: "praia", name: "Praia" }]).map(
          (place) => {
            const reading = "today" in place ? (place as Reading) : null;
            return (
              <li
                key={place.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="font-medium">{place.name}</span>
                <span className="flex items-center gap-4 text-white/85">
                  <span className="flex items-center gap-1.5">
                    <small className="text-white/55">Auj.</small>
                    <strong className="tabular-nums">
                      {reading ? `${reading.today.temperature}°` : "—°"}
                    </strong>
                    {reading ? (
                      weatherIcon(reading.today.code, "h-4 w-4 text-star-400")
                    ) : (
                      <span className="inline-block h-4 w-4 animate-pulse rounded-full bg-white/20" />
                    )}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <small className="text-white/55">Demain</small>
                    <strong className="tabular-nums">
                      {reading ? `${reading.tomorrow.temperature}°` : "—°"}
                    </strong>
                    {reading ? (
                      weatherIcon(reading.tomorrow.code, "h-4 w-4 text-star-400")
                    ) : (
                      <span className="inline-block h-4 w-4 animate-pulse rounded-full bg-white/20" />
                    )}
                  </span>
                </span>
              </li>
            );
          },
        )}
      </ul>
    </div>
  );
}
