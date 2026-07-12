import type { ActivityType } from "@/db/schema";

type IconProps = { className?: string };

function base(props: IconProps) {
  return {
    className: props.className ?? "h-4 w-4",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    "aria-hidden": true as const,
  };
}

export function PlaneIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10.5 13.5 3 11l1.5-2 6.5 1 4.5-5.5c.6-.7 1.7-.8 2.4-.1.7.7.6 1.8-.1 2.4L12.5 11l1 6.5-2 1.5-2.5-7.5Z" />
      <path d="M4 20h16" />
    </svg>
  );
}

export function FerryIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 15h16l-1.5 3.5a2 2 0 0 1-1.8 1.2H7.3a2 2 0 0 1-1.8-1.2L4 15Z" />
      <path d="M6 15V8a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7" />
      <path d="M12 7V4m-3 0h6" />
    </svg>
  );
}

export function HouseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m4 11 8-7 8 7" />
      <path d="M6 9.5V20h12V9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

export function CarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 16v2m14-2v2" />
      <path d="M4 12 5.7 7a2 2 0 0 1 1.9-1.4h8.8A2 2 0 0 1 18.3 7L20 12" />
      <rect x="3" y="12" width="18" height="5" rx="1.5" />
      <path d="M6.5 14.5h.01m11 0h.01" />
    </svg>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </svg>
  );
}

export function MealIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 3v8m-2.5-8v5a2.5 2.5 0 0 0 5 0V3" />
      <path d="M7 11v10" />
      <path d="M17 3c-1.7 1.5-2.5 3.8-2.5 6v3H17m0-9v18" />
    </svg>
  );
}

export function BusIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="4" width="16" height="13" rx="2" />
      <path d="M4 10h16M7 20v-3m10 3v-3" />
      <path d="M8 14h.01m7.99 0h.01" />
    </svg>
  );
}

export function BeachIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 20c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" />
      <path d="M13 16 8 5.5A6.5 6.5 0 0 1 16.8 9L13 16Z" />
      <path d="M8 5.5C10.5 5 14 6.5 16.8 9" />
    </svg>
  );
}

export function HikeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m3 20 6-11 4 6 3-4 5 9H3Z" />
      <circle cx="16" cy="5" r="1.6" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m12 3 2.5 5.5 6 .7-4.5 4 1.2 5.8L12 16l-5.2 3 1.2-5.8-4.5-4 6-.7L12 3Z" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="m14 7 3 3" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h16m-2 0-1 13H7L6 7m3 0V4h6v3m-5 4v6m4-6v6" />
    </svg>
  );
}

export function ChevronIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m8 10 4 4 4-4" />
    </svg>
  );
}

export function GripIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01" />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 4v11m0 0 4-4m-4 4-4-4" />
      <path d="M5 19h14" />
    </svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M14 5h5v5m0-5-8 8" />
      <path d="M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2m0 15v2M4.6 4.6l1.4 1.4m12 12 1.4 1.4M2.5 12h2m15 0h2M4.6 19.4 6 18m12-12 1.4-1.4" />
    </svg>
  );
}

export function CloudSunIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 5V3.5M3.5 9.5H5m.5-4L6.7 6.7M12.5 5.5a3.5 3.5 0 0 0-6.3 3" />
      <path d="M8.5 18.5h8a3.5 3.5 0 0 0 .5-7 5 5 0 0 0-9.6 1.5 3 3 0 0 0 1.1 5.5Z" />
    </svg>
  );
}

export function CloudIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 18.5h9.5a4 4 0 0 0 .6-8 6 6 0 0 0-11.5 1.8A3.5 3.5 0 0 0 7 18.5Z" />
    </svg>
  );
}

export function RainIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 15h9.5a4 4 0 0 0 .6-8 6 6 0 0 0-11.5 1.8A3.5 3.5 0 0 0 7 15Z" />
      <path d="M8 18v2.5m4-2.5v2.5m4-2.5v2.5" />
    </svg>
  );
}

export function StormIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 14h9.5a4 4 0 0 0 .6-8 6 6 0 0 0-11.5 1.8A3.5 3.5 0 0 0 7 14Z" />
      <path d="m12 14-2 4h3l-2 4" />
    </svg>
  );
}

export function ActivityTypeIcon({
  type,
  className,
}: {
  type: ActivityType;
  className?: string;
}) {
  switch (type) {
    case "flight":
      return <PlaneIcon className={className} />;
    case "ferry":
      return <FerryIcon className={className} />;
    case "lodging":
      return <HouseIcon className={className} />;
    case "car":
      return <CarIcon className={className} />;
    case "meal":
      return <MealIcon className={className} />;
    case "transport":
      return <BusIcon className={className} />;
    case "beach":
      return <BeachIcon className={className} />;
    case "hike":
      return <HikeIcon className={className} />;
    case "option":
      return <StarIcon className={className} />;
    default:
      return <CompassIcon className={className} />;
  }
}

export function weatherIcon(code: number, className?: string) {
  if (code === 0) return <SunIcon className={className} />;
  if ([1, 2].includes(code)) return <CloudSunIcon className={className} />;
  if (code === 3 || [45, 48].includes(code)) return <CloudIcon className={className} />;
  if ([95, 96, 99].includes(code)) return <StormIcon className={className} />;
  if (code >= 51) return <RainIcon className={className} />;
  return <CloudSunIcon className={className} />;
}
