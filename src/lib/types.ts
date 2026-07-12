import type { ActivityType } from "@/db/schema";

export type ActivityDTO = {
  id: number;
  dayId: number;
  title: string;
  type: ActivityType;
  isMandatory: boolean;
  isOptional: boolean;
  startTime: string | null;
  endTime: string | null;
  duration: string | null;
  cost: number | null;
  costShared: boolean;
  location: string | null;
  contact: string | null;
  bookingUrl: string | null;
  sourceUrl: string | null;
  notes: string | null;
  constraints: string[];
  images: { url: string; alt: string; credit?: string; source?: string }[];
  practicalInfo: {
    access?: string;
    duration?: string;
    difficulty?: string;
    equipment?: string;
    advice?: string;
  } | null;
  subActivities: { name: string; description?: string; cost?: string; status?: string }[];
  placeDescription: string | null;
  ferrySchedule: string | null;
};

export type DayDTO = {
  id: number;
  date: string;
  island: string | null;
  title: string | null;
  notes: string | null;
  activities: ActivityDTO[];
};

export type TripDTO = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  currency: string;
  persons: number;
  exchangeRateCve: number;
  totalBudget: number | null;
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  flight: "Vol",
  ferry: "Ferry",
  lodging: "Logement",
  car: "Voiture",
  visit: "Visite",
  meal: "Repas",
  transport: "Transport",
  beach: "Plage",
  hike: "Randonnée",
  option: "Option",
};
