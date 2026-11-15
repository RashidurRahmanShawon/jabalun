import "server-only";
import { getAdminProducts, getCategories, getOrderStatsRows, getOrderStatusTotals, getOrders } from "@/lib/woo";
import { decodeEntities } from "@/lib/text";
import { getSupabaseServer } from "@/lib/supabase-server";
import { ANALYTICS } from "@/lib/admin/mock-data";

export const CONNECTION_ERROR = "ডাটাবেসের সাথে সংযোগ করা যায়নি।";

// Order statuses (English labels, WooCommerce style)
const STATUS = {
  pending: { label: "Pending payment", tone: "amber" },
  processing: { label: "Processing", tone: "blue" },
  "on-hold": { label: "On hold", tone: "amber" },
  completed: { label: "Completed", tone: "green" },
  cancelled: { label: "Cancelled", tone: "red" },
  refunded: { label: "Refunded", tone: "neutral" },
  failed: { label: "Failed", tone: "red" },
  "checkout-draft": { label: "Draft", tone: "neutral" },
};

export function statusInfo(slug, fallbackName) {
  return STATUS[slug] ?? { label: fallbackName || slug, tone: "violet" };
}

// Not counted as sales
const NOT_SALES = new Set(["cancelled", "failed", "refunded", "checkout-draft", "trash"]);

const DAY = 24 * 60 * 60 * 1000;
const DHAKA_OFFSET = 6 * 60 * 60 * 1000; // Bangladesh has no daylight saving

// "YYYY-MM-DD" of a moment in Dhaka time
const dhakaDay = (ms) => {
  const numMs = Number(ms);
  if (!Number.isFinite(numMs)) return new Date().toISOString().slice(0, 10);
  return new Date(numMs + DHAKA_OFFSET).toISOString().slice(0, 10);
};

const gmtMs = (order) => {
  const raw = order.created_at || order.date_created_gmt || order.date;
  if (!raw) return Date.now();
  if (typeof raw === "number") return raw;
  const str = String(raw).trim();
  const parsed = Date.parse(str.endsWith("Z") || str.includes("+") ? str : `${str}Z`);
  return Number.isNaN(parsed) ? Date.now() : parsed;
};

export function orderSummary(order) {
  const name = [order.billing?.first_name, order.billing?.last_name].filter(Boolean).join(" ");
  return {
    id: order.id,
    number: order.number ?? String(order.id),
    date: new Date(gmtMs(order)).toISOString(),
    customerName: decodeEntities(name) || "—",
    itemCount: (order.line_items ?? []).reduce((sum, item) => sum + item.quantity, 0),
    total: Number(order.total) || 0,
    status: order.status,
    source: order.source || "unknown",
  };
}

const LIST_FIELDS = ["id", "number", "status", "total", "date_created_gmt", "billing", "line_items"];

// ---------- Date ranges (Dhaka time; the week starts on Saturday) ----------

const MONTHS_BN = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const dhakaMidnight = (key) => Date.parse(`${key}T00:00:00+06:00`);
const monthKeyOf = (ms) => dhakaDay(ms).slice(0, 7);
export const monthLabel = (key) => `${MONTHS_BN[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;

function nextMonthKey(key) {
  const [y, m] = key.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

// "today" | "week" | "month" | "YYYY-MM" -> { after, before } as ms (before exclusive)
export function dateRange(filter, now = Date.now()) {
  const todayKey = dhakaDay(now);
  const todayStart = dhakaMidnight(todayKey);
  if (filter === "today") return { after: todayStart, before: todayStart + DAY };
  if (filter === "week") {
    const weekday = new Date(`${todayKey}T00:00:00Z`).getUTCDay(); // 0 Sun … 6 Sat
    const start = todayStart - ((weekday + 1) % 7) * DAY;
    return { after: start, before: start + 7 * DAY };
  }
  const month = filter === "month" ? todayKey.slice(0, 7) : /^\d{4}-(0[1-9]|1[0-2])$/.test(filter || "") ? filter : null;
  if (!month) return null;
  return { after: dhakaMidnight(`${month}-01`), before: dhakaMidnight(`${nextMonthKey(month)}-01`) };
}

export const DATE_FILTERS = { today: "আজ", week: "এই সপ্তাহ", month: "এই মাস" };

export function dateFilterLabel(filter) {
  return DATE_FILTERS[filter] ?? (/^\d{4}-\d{2}$/.test(filter || "") ? monthLabel(filter) : "সব তারিখ");
}

export async function loadOrderList({ status, page, date, source }) {
  try {
    const range = date ? dateRange(date) : null;
    const [{ orders, total, totalPages }, totals, stats] = await Promise.all([
      getOrders({
        page,
        perPage: 20,
        status,
        source,
        after: range ? new Date(range.after).toISOString() : undefined,
        before: range ? new Date(range.before).toISOString() : undefined,
        fields: LIST_FIELDS,
      }),
      getOrderStatusTotals(),
      loadOrderStats(range),
    ]);
    return {
      orders: orders.map(orderSummary),
      total,
      totalPages,
      statuses: totals.map((s) => ({ slug: s.slug, name: s.name, total: Number(s.total) || 0 })),
      stats,
    };
  } catch (error) {
    console.error("Admin orders failed:", error.message);
    return { error: CONNECTION_ERROR };
  }
}

// Counters for the orders page: today / this week / this month, month by month,
// and orders per source within the selected date range (or all time).
async function loadOrderStats(range) {
  const { rows, hasSource } = await getOrderStatsRows();
  const now = Date.now();
  const periods = {
    today: dateRange("today", now),
    week: dateRange("week", now),
    month: dateRange("month", now),
  };
  const blank = () => ({ orders: 0, revenue: 0 });
  const cards = { today: blank(), week: blank(), month: blank() };
  const months = new Map();
  const sources = new Map();

  for (const row of rows) {
    const ms = gmtMs(row);
    const isSale = !NOT_SALES.has(row.status);
    const amount = isSale ? Number(row.total) || 0 : 0;

    for (const [key, period] of Object.entries(periods)) {
      if (ms >= period.after && ms < period.before) {
        cards[key].orders += 1;
        cards[key].revenue += amount;
      }
    }

    const monthKey = monthKeyOf(ms);
    const month = months.get(monthKey) ?? { key: monthKey, label: monthLabel(monthKey), orders: 0, sales: 0, revenue: 0 };
    month.orders += 1;
    if (isSale) month.sales += 1;
    month.revenue += amount;
    months.set(monthKey, month);

    if (!range || (ms >= range.after && ms < range.before)) {
      const id = row.source || "unknown";
      const entry = sources.get(id) ?? { id, orders: 0, revenue: 0 };
      entry.orders += 1;
      entry.revenue += amount;
      sources.set(id, entry);
    }
  }

  return {
    cards,
    months: [...months.values()].sort((a, b) => b.key.localeCompare(a.key)),
    sources: [...sources.values()].sort((a, b) => b.orders - a.orders),
    hasSource,
  };
}

// Last 30 days (Dhaka time), up to 1000 orders
export async function loadOverview() {
  try {
    const now = Date.now();
    const todayKey = dhakaDay(now);
    const startMs = Date.parse(`${dhakaDay(now - 29 * DAY)}T00:00:00+06:00`);

    const orders = [];
    for (let page = 1; page <= 10; page += 1) {
      const result = await getOrders({
        page,
        perPage: 100,
        after: new Date(startMs).toISOString(),
        fields: LIST_FIELDS,
      });
      orders.push(...result.orders);
      if (page >= result.totalPages) break;
    }

    const sales = orders.filter((o) => !NOT_SALES.has(o.status));
    const days = Array.from({ length: 30 }, (_, i) => ({
      date: `${dhakaDay(startMs + i * DAY)}T00:00:00+06:00`,
      key: dhakaDay(startMs + i * DAY),
      revenue: 0,
      orders: 0,
    }));
    const byDay = new Map(days.map((d) => [d.key, d]));
    const products = new Map();

    for (const order of sales) {
      const day = byDay.get(dhakaDay(gmtMs(order)));
      if (day) {
        day.revenue += Number(order.total) || 0;
        day.orders += 1;
      }
      for (const item of order.line_items ?? []) {
        const entry = products.get(item.product_id) ?? { name: decodeEntities(item.name), sold: 0 };
        entry.sold += item.quantity;
        products.set(item.product_id, entry);
      }
    }

    const today = byDay.get(todayKey);
    const revenue30 = sales.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    return {
      todayRevenue: today?.revenue ?? 0,
      todayOrders: today?.orders ?? 0,
      orders30: sales.length,
      averageOrder: sales.length ? revenue30 / sales.length : 0,
      days: days.map(({ date, revenue, orders: count }) => ({ date, revenue, orders: count })),
      recent: orders.slice(0, 5).map(orderSummary),
      topProducts: [...products.values()].sort((a, b) => b.sold - a.sold).slice(0, 5),
    };
  } catch (error) {
    console.error("Admin overview failed:", error.message);
    return { error: CONNECTION_ERROR };
  }
}

const LOW_STOCK = 5;

export async function loadAdminProducts() {
  try {
    const products = await getAdminProducts();
    const rows = products.map((p) => {
      const name = decodeEntities(p.name || "");
      return {
        id: p.id,
        name,
        // slug + description must reach the editor, or saving would change the URL and wipe the text
        slug: p.slug,
        description: p.description || "",
        designNumber: p.designNumber || name.match(/(\d+)\s*$/)?.[1] || "",
        image: p.images?.[0]?.src ?? null,
        price: p.price,
        regularPrice: Number(p.regular_price) || Number(p.price) || 0,
        manageStock: Boolean(p.manage_stock),
        stock: p.stock_quantity,
        stockStatus: p.stock_status,
        categories: (p.categories ?? []).map((c) => ({ id: c.slug, name: decodeEntities(c.name) })),
        status: p.status,
      };
    });
    return {
      products: rows,
      lowStock: rows.filter((p) => p.status !== "trash" && p.manageStock && p.stock !== null && p.stock <= LOW_STOCK),
      outOfStock: rows.filter((p) => p.status !== "trash" && p.stockStatus === "outofstock"),
      stockTracked: rows.some((p) => p.manageStock),
    };
  } catch (error) {
    console.error("Admin products failed:", error.message);
    return { error: CONNECTION_ERROR };
  }
}

export async function loadAnalyticsData() {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { live: false, data: ANALYTICS };
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: events, error } = await supabase
      .from("analytics_events")
      .select("type, sid, path, data, created_at")
      .gte("created_at", thirtyDaysAgo);

    if (error || !events || events.length === 0) {
      return { live: false, data: ANALYTICS };
    }

    const pageViews = events.filter((e) => e.type === "page_view").length;
    const uniqueVisitors = new Set(events.map((e) => e.sid).filter(Boolean)).size;

    const clickCounts = new Map();
    for (const e of events) {
      if (e.type === "click" && e.data?.target) {
        clickCounts.set(e.data.target, (clickCounts.get(e.data.target) || 0) + 1);
      }
    }
    const topClicks = [...clickCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value }));

    return {
      live: true,
      data: {
        kpis: {
          pageViews: pageViews || ANALYTICS.kpis.pageViews,
          uniqueVisitors: uniqueVisitors || ANALYTICS.kpis.uniqueVisitors,
          avgSessionSeconds: ANALYTICS.kpis.avgSessionSeconds,
          bounceRate: ANALYTICS.kpis.bounceRate,
        },
        funnel: ANALYTICS.funnel,
        topClicks: topClicks.length > 0 ? topClicks : ANALYTICS.topClicks,
        fieldDropoff: ANALYTICS.fieldDropoff,
        scrollDepth: ANALYTICS.scrollDepth,
        pageTime: ANALYTICS.pageTime,
      },
    };
  } catch (err) {
    console.error("Failed to load live analytics from Supabase:", err.message);
    return { live: false, data: ANALYTICS };
  }
}

// ---------- Category share of sales (overview pie chart) ----------

// Validated categorical palette (dataviz reference, light mode), in fixed slot order.
// A category keeps its slot forever: slot = its position in creation order.
// ink = text colour readable on top of that slice.
export const CATEGORY_COLORS = [
  { fill: "#2a78d6", ink: "#ffffff" },
  { fill: "#eb6834", ink: "#ffffff" },
  { fill: "#1baf7a", ink: "#0b0b0b" },
  { fill: "#eda100", ink: "#0b0b0b" },
  { fill: "#e87ba4", ink: "#0b0b0b" },
  { fill: "#008300", ink: "#ffffff" },
  { fill: "#6250d6", ink: "#ffffff" },
  { fill: "#e34948", ink: "#ffffff" },
];
const OTHER_COLOR = { fill: "#8a8986", ink: "#ffffff" };

// period: "30d" (last 30 days, Dhaka time) or "all"
export async function loadCategorySales(period = "30d") {
  try {
    const after = period === "all" ? undefined : new Date(dhakaMidnight(dhakaDay(Date.now() - 29 * DAY))).toISOString();
    const [categories, products] = await Promise.all([getCategories(), getAdminProducts()]);
    const orders = [];
    for (let page = 1; page <= 50; page += 1) {
      const result = await getOrders({ page, perPage: 100, after });
      orders.push(...result.orders);
      if (page >= result.totalPages) break;
    }

    const categoryOf = new Map(products.map((p) => [Number(p.id), p.categories?.[0]?.slug]));
    // Up to 8 categories get their own colour; any beyond that share one "অন্যান্য" slice
    const slices = categories.map((c, i) => ({
      id: c.slug,
      name: decodeEntities(c.name),
      color: CATEGORY_COLORS[i] ?? null,
      units: 0,
      revenue: 0,
    }));
    const bySlug = new Map(slices.filter((s) => s.color).map((s) => [s.id, s]));
    const other = { id: "__other", name: "অন্যান্য", color: OTHER_COLOR, units: 0, revenue: 0 };

    for (const order of orders) {
      if (NOT_SALES.has(order.status)) continue;
      for (const item of order.line_items ?? []) {
        const slug = categoryOf.get(Number(item.product_id));
        const slice = bySlug.get(slug) ?? other;
        slice.units += Number(item.quantity) || 0;
        slice.revenue += Number(item.subtotal) || 0;
      }
    }

    const rows = [...slices.filter((s) => s.color), ...(other.units > 0 || slices.some((s) => !s.color) ? [other] : [])];
    const totalUnits = rows.reduce((sum, r) => sum + r.units, 0);
    return {
      period,
      totalUnits,
      totalRevenue: rows.reduce((sum, r) => sum + r.revenue, 0),
      rows: rows.map((r) => ({ ...r, share: totalUnits ? (r.units / totalUnits) * 100 : 0 })),
    };
  } catch (error) {
    console.error("Admin category sales failed:", error.message);
    return { error: CONNECTION_ERROR };
  }
}

// Categories for admin forms: [{ id: slug, name, description }] in creation order
export async function loadCategoryList() {
  try {
    const rows = await getCategories();
    return { list: rows.map((c) => ({ id: c.slug, name: decodeEntities(c.name), description: c.description || "" })) };
  } catch (error) {
    console.error("Admin categories failed:", error.message);
    return { error: CONNECTION_ERROR };
  }
}
