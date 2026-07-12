import { NextResponse } from "next/server";

const PLACES = [
  { id: "sal", name: "Sal", latitude: 16.7266, longitude: -22.9297 },
  { id: "boavista", name: "Boa Vista", latitude: 16.1765, longitude: -22.9172 },
  { id: "praia", name: "Praia", latitude: 14.9331, longitude: -23.5133 },
] as const;

export type WeatherReading = {
  id: string;
  name: string;
  today: { temperature: number; code: number };
  tomorrow: { temperature: number; code: number };
};

export async function GET() {
  try {
    const readings = await Promise.all(
      PLACES.map(async (place): Promise<WeatherReading> => {
        const query = new URLSearchParams({
          latitude: String(place.latitude),
          longitude: String(place.longitude),
          current: "temperature_2m,weather_code",
          daily: "weather_code,temperature_2m_max",
          forecast_days: "2",
          timezone: "Atlantic/Cape_Verde",
        });
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?${query}`,
          { next: { revalidate: 1800 } },
        );
        if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);
        const data = await response.json();
        return {
          id: place.id,
          name: place.name,
          today: {
            temperature: Math.round(data.current.temperature_2m),
            code: data.current.weather_code,
          },
          tomorrow: {
            temperature: Math.round(data.daily.temperature_2m_max[1]),
            code: data.daily.weather_code[1],
          },
        };
      }),
    );

    return NextResponse.json({ readings, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Météo indisponible :", error);
    return NextResponse.json(
      { error: "Données météo indisponibles" },
      { status: 503 },
    );
  }
}
