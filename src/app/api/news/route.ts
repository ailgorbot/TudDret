import { NextResponse } from "next/server";

const NEWS_PAGE = "https://information.tv5monde.com/pays/cap-vert";
const RSS_URL =
  "https://news.google.com/rss/search?q=site%3Ainformation.tv5monde.com%20%22Cap-Vert%22&hl=fr&gl=FR&ceid=FR%3Afr";

export type NewsItem = { title: string; link: string; pubDate: string };

const FALLBACK_NEWS: NewsItem[] = [
  {
    title: "Mondial 2026 : après l'Espagne, le Cap-Vert récidive contre l'Uruguay",
    pubDate: "2026-06-22T02:15:13Z",
    link: NEWS_PAGE,
  },
  {
    title: "Le parcours de Vozinha, gardien héroïque du Cabo Verde devenu star des réseaux sociaux",
    pubDate: "2026-06-16T10:12:00Z",
    link: NEWS_PAGE,
  },
  {
    title: "Coupe du monde 2026 : des débuts historiques pour le Cap-Vert",
    pubDate: "2026-06-16T07:20:03Z",
    link: NEWS_PAGE,
  },
  {
    title: "Coupe du monde 2026 : les dernières nouvelles de la sélection cap-verdienne",
    pubDate: "2026-06-15T12:00:00Z",
    link: NEWS_PAGE,
  },
];

function decodeEntities(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'");
}

/** Extraction minimaliste des <item> d'un flux RSS, sans dépendance XML. */
function parseRss(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  for (const block of itemBlocks) {
    const title = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1];
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1];
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
    if (!title || !link) continue;
    const cleaned = decodeEntities(title.trim()).replace(/\s*-\s*TV5MONDE\s*$/i, "");
    if (/^(Afrique|Sport|CAP-VERT)$/i.test(cleaned)) continue;
    items.push({
      title: cleaned,
      link: link.trim(),
      pubDate: pubDate ? new Date(pubDate.trim()).toISOString() : new Date().toISOString(),
    });
  }
  return items;
}

export async function GET() {
  try {
    const response = await fetch(RSS_URL, {
      next: { revalidate: 1800 },
      headers: { "User-Agent": "TudDret/1.0 (carnet de voyage)" },
    });
    if (!response.ok) throw new Error(`RSS ${response.status}`);
    const items = parseRss(await response.text()).slice(0, 4);
    if (items.length < 4) throw new Error("Flux incomplet");
    return NextResponse.json({ items, live: true, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Flux d'actualités indisponible :", error);
    return NextResponse.json({
      items: FALLBACK_NEWS,
      live: false,
      updatedAt: new Date().toISOString(),
    });
  }
}
