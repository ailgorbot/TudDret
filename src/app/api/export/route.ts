import ExcelJS from "exceljs";
import { getTripData } from "@/lib/queries";
import { ACTIVITY_TYPE_LABELS } from "@/lib/types";
import {
  formatDayLabel,
  formatEuro,
  formatShortDate,
  formatTime,
} from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Charte TudDret : bleu océan, sable, corail, jaune étoile, vert palmier.
const OCEAN = "FF003893";
const OCEAN_HEADER = "FF1D4E89";
const STAR = "FFF5C542";
const SAND = "FFF3EADB";
const WHITE = "FFFFFFFF";
const INK = "FF0B2545";

const ISLAND_STYLE: Record<string, { fill: string; text: string }> = {
  Sal: { fill: "FFFDF0CC", text: "FF8A6A00" },
  "Boa Vista": { fill: "FFFBE0D8", text: "FFA5381F" },
  Santiago: { fill: "FFD8E3F3", text: OCEAN },
  Fogo: { fill: "FFDCEBDD", text: "FF2C6B3F" },
};
const ISLAND_FALLBACK = { fill: SAND, text: "FF6B5B3A" };

type ExportDay = Awaited<ReturnType<typeof getTripData>> extends infer T
  ? T extends { days: (infer D)[] }
    ? D
    : never
  : never;

// Contribution budgétaire d'une activité (comme le budget estimé de l'accueil).
function contribution(cost: number | null, shared: boolean, persons: number): number {
  if (cost == null) return 0;
  return shared ? cost : cost * persons;
}

// Découpe l'itinéraire en périodes : une nouvelle période à chaque changement d'île.
function toPeriods(days: ExportDay[]): { island: string; days: ExportDay[] }[] {
  const periods: { island: string; days: ExportDay[] }[] = [];
  for (const day of days) {
    const island = day.island ?? "—";
    const last = periods[periods.length - 1];
    if (last && last.island === island) last.days.push(day);
    else periods.push({ island, days: [day] });
  }
  return periods;
}

export async function GET() {
  const data = await getTripData();
  if (!data) {
    return new Response("Aucun voyage à exporter.", { status: 404 });
  }

  const { trip, days } = data;
  const persons = trip.persons;

  const wb = new ExcelJS.Workbook();
  wb.creator = "TudDret";
  wb.created = new Date();
  const ws = wb.addWorksheet("Itinéraire", {
    views: [{ showGridLines: false }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });

  const COLUMNS = [
    { key: "date", width: 18 },
    { key: "day", width: 26 },
    { key: "activity", width: 48 },
    { key: "type", width: 15 },
    { key: "time", width: 14 },
    { key: "mandatory", width: 12 },
    { key: "cost", width: 13 },
  ];
  ws.columns = COLUMNS.map((c) => ({ width: c.width }));
  const LAST_COL = "G";

  const solid = (argb: string): ExcelJS.Fill => ({
    type: "pattern",
    pattern: "solid",
    fgColor: { argb },
  });
  const thin = { style: "thin" as const, color: { argb: "FFD9D9D9" } };
  const borderAll = { top: thin, left: thin, bottom: thin, right: thin };

  let r = 1;

  // Bandeau titre.
  ws.mergeCells(`A${r}:${LAST_COL}${r}`);
  const title = ws.getCell(`A${r}`);
  title.value = `TudDret — ${trip.name}`;
  title.fill = solid(OCEAN);
  title.font = { name: "Calibri", size: 16, bold: true, color: { argb: WHITE } };
  title.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(r).height = 30;
  r++;

  // Sous-titre : période, voyageurs, budget estimé.
  const estimated = days
    .flatMap((d) => d.activities)
    .reduce((sum, a) => sum + contribution(a.cost != null ? Number(a.cost) : null, a.costShared, persons), 0);
  ws.mergeCells(`A${r}:${LAST_COL}${r}`);
  const sub = ws.getCell(`A${r}`);
  sub.value =
    `${formatDayLabel(trip.startDate)} → ${formatDayLabel(trip.endDate)}` +
    `   ·   ${persons} voyageur${persons > 1 ? "s" : ""}` +
    `   ·   Budget estimé ${formatEuro(estimated)}`;
  sub.fill = solid(SAND);
  sub.font = { name: "Calibri", size: 11, italic: true, color: { argb: INK } };
  sub.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(r).height = 22;
  r += 2; // ligne d'espacement

  const HEADERS = ["Date", "Journée", "Activité", "Type", "Horaire", "Impératif", "Coût (€)"];

  for (const period of toPeriods(days)) {
    const style = ISLAND_STYLE[period.island] ?? ISLAND_FALLBACK;
    const first = period.days[0].date;
    const last = period.days[period.days.length - 1].date;
    const span =
      period.days.length > 1
        ? `du ${formatShortDate(first)} au ${formatShortDate(last)}`
        : `le ${formatShortDate(first)}`;

    // En-tête de période (île).
    ws.mergeCells(`A${r}:${LAST_COL}${r}`);
    const head = ws.getCell(`A${r}`);
    head.value = `${period.island}   ·   ${span}   ·   ${period.days.length} jour${period.days.length > 1 ? "s" : ""}`;
    head.fill = solid(style.fill);
    head.font = { name: "Calibri", size: 12, bold: true, color: { argb: style.text } };
    head.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    ws.getRow(r).height = 24;
    r++;

    // En-têtes de colonnes.
    const headerRow = ws.getRow(r);
    HEADERS.forEach((label, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = label;
      cell.fill = solid(OCEAN_HEADER);
      cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: WHITE } };
      cell.alignment = { vertical: "middle", horizontal: i >= 5 ? "center" : "left", indent: i < 5 ? 1 : 0 };
      cell.border = borderAll;
    });
    headerRow.height = 18;
    r++;

    let periodTotal = 0;

    for (const day of period.days) {
      const activities = day.activities.length > 0 ? day.activities : [null];
      activities.forEach((activity, idx) => {
        const row = ws.getRow(r);
        const dateCell = row.getCell(1);
        const dayCell = row.getCell(2);
        // La date et le titre de journée n'apparaissent que sur la 1re ligne du jour.
        if (idx === 0) {
          dateCell.value = formatDayLabel(day.date);
          dayCell.value = day.title ?? "";
          dateCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: INK } };
          dayCell.font = { name: "Calibri", size: 10, italic: true, color: { argb: INK } };
        }

        if (activity) {
          const cost = activity.cost != null ? Number(activity.cost) : null;
          const budget = contribution(cost, activity.costShared, persons);
          periodTotal += budget;

          row.getCell(3).value = activity.title;
          row.getCell(4).value = ACTIVITY_TYPE_LABELS[activity.type] ?? activity.type;
          const start = formatTime(activity.startTime);
          const end = formatTime(activity.endTime);
          row.getCell(5).value = start ? (end ? `${start} – ${end}` : start) : "";
          row.getCell(6).value = activity.isMandatory ? "Oui" : "";
          if (cost != null) {
            const c = row.getCell(7);
            c.value = budget;
            c.numFmt = '#,##0.00" €"';
          }
        } else {
          row.getCell(3).value = "— aucune activité —";
          row.getCell(3).font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF9AA5B1" } };
        }

        for (let col = 1; col <= 7; col++) {
          const cell = row.getCell(col);
          cell.border = borderAll;
          if (!cell.alignment) {
            cell.alignment = {
              vertical: "top",
              horizontal: col === 6 ? "center" : col === 7 ? "right" : "left",
              indent: col <= 5 ? 1 : 0,
              wrapText: col === 3,
            };
          }
        }
        r++;
      });
    }

    // Sous-total de l'île.
    ws.mergeCells(`A${r}:F${r}`);
    const label = ws.getCell(`A${r}`);
    label.value = `Sous-total ${period.island}`;
    label.font = { name: "Calibri", size: 10, bold: true, color: { argb: style.text } };
    label.alignment = { vertical: "middle", horizontal: "right", indent: 1 };
    label.fill = solid(style.fill);
    const totalCell = ws.getCell(`G${r}`);
    totalCell.value = periodTotal;
    totalCell.numFmt = '#,##0.00" €"';
    totalCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: style.text } };
    totalCell.fill = solid(style.fill);
    totalCell.alignment = { vertical: "middle", horizontal: "right" };
    ws.getRow(r).height = 20;
    r += 2; // espacement entre îles
  }

  // Total général.
  ws.mergeCells(`A${r}:F${r}`);
  const grandLabel = ws.getCell(`A${r}`);
  grandLabel.value = "Total estimé du voyage";
  grandLabel.fill = solid(STAR);
  grandLabel.font = { name: "Calibri", size: 12, bold: true, color: { argb: INK } };
  grandLabel.alignment = { vertical: "middle", horizontal: "right", indent: 1 };
  const grandTotal = ws.getCell(`G${r}`);
  grandTotal.value = estimated;
  grandTotal.numFmt = '#,##0.00" €"';
  grandTotal.fill = solid(STAR);
  grandTotal.font = { name: "Calibri", size: 12, bold: true, color: { argb: INK } };
  grandTotal.alignment = { vertical: "middle", horizontal: "right" };
  ws.getRow(r).height = 26;
  r += 2;

  // Signature.
  ws.mergeCells(`A${r}:${LAST_COL}${r}`);
  const foot = ws.getCell(`A${r}`);
  foot.value = `Feito com morabeza · exporté le ${formatDayLabel(new Date().toISOString().slice(0, 10))}`;
  foot.font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF9AA5B1" } };
  foot.alignment = { horizontal: "left", indent: 1 };

  ws.getColumn(3).alignment = { wrapText: true, vertical: "top" };

  const buffer = await wb.xlsx.writeBuffer();
  const filename = `TudDret-itineraire-${trip.slug}.xlsx`;

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
