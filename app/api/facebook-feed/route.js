import { getCategories, getProducts } from "@/lib/woo";
import { decodeEntities, stripTags } from "@/lib/text";

// Product feed for the Facebook / Meta catalog (Commerce Manager → Data sources → Scheduled feed).
// CSV, one row per published product. `id` is the Supabase product id — the same id the
// Meta Pixel sends as content_ids — so ads, catalog and pixel events match up.
// Draft and trashed products are left out (getProducts returns published only).

const SITE_URL = "https://www.jabalun.com";
const BRAND = "Jabalun";
const COLUMNS = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "sale_price",
  "link",
  "image_link",
  "brand",
  "product_type",
  "custom_label_0",
];

export const revalidate = 3600; // Meta fetches it daily; an hour-old copy is fine

// CSV cell: always quoted, inner quotes doubled, no line breaks
function cell(value) {
  return `"${String(value ?? "").replace(/[\r\n]+/g, " ").replace(/"/g, '""')}"`;
}

const money = (amount) => `${Number(amount).toFixed(2)} BDT`;

function absolute(url) {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export async function GET() {
  const [products, categories] = await Promise.all([
    getProducts({ perPage: 2000 }),
    getCategories().catch(() => []),
  ]);
  const categoryName = Object.fromEntries(categories.map((c) => [c.slug, c.name]));

  const rows = products
    // Meta rejects items without a price, image or link
    .filter((p) => Number(p.price) > 0 && p.images?.[0]?.src && p.slug)
    .map((p) => {
      const title = decodeEntities(p.name || "").slice(0, 200);
      const description = stripTags(p.description || p.short_description || "").slice(0, 5000) || title;
      const price = Number(p.price);
      const regular = Number(p.regular_price) || price;
      const onSale = regular > price;
      const category = p.categories?.[0]?.slug || "";
      return [
        p.id,
        title,
        description,
        p.stock_status === "outofstock" ? "out of stock" : "in stock",
        "new",
        money(onSale ? regular : price),
        onSale ? money(price) : "",
        `${SITE_URL}/product/${encodeURIComponent(p.slug)}`,
        absolute(p.images[0].src),
        BRAND,
        categoryName[category] || category,
        category, // e.g. "khimar-plazu-set" — handy for building product sets
      ];
    });

  const csv = [COLUMNS, ...rows].map((row) => row.map(cell).join(",")).join("\n");

  return new Response(`﻿${csv}\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'inline; filename="jabalun-facebook-feed.csv"',
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
