import "server-only";
import { getAdminProducts, getOrderStatusTotals, getOrders } from "@/lib/woo";
import { decodeEntities } from "@/lib/text";

export const CONNECTION_ERROR = "WooCommerce-এর সাথে সংযোগ হয়নি।";

// WooCommerce's own statuses in Bangla; plugin statuses keep their own name
const STATUS = {
  pending: { label: "পেমেন্টের অপেক্ষায়", tone: "amber" },
  processing: { label: "প্রক্রিয়াধীন", tone: "blue" },
  "on-hold": { label: "স্থগিত", tone: "amber" },
  completed: { label: "সম্পন্ন / ডেলিভারি হয়েছে", tone: "green" },
  cancelled: { label: "বাতিল", tone: "red" },
  refunded: { label: "ফেরত", tone: "neutral" },
  failed: { label: "ব্যর্থ", tone: "red" },
  "checkout-draft": { label: "খসড়া", tone: "neutral" },
};

export function statusInfo(slug, fallbackName) {
  return STATUS[slug] ?? { label: fallbackName || slug, tone: "violet" };
}

// Not counted as sales
const NOT_SALES = new Set(["cancelled", "failed", "refunded", "checkout-draft", "trash"]);

const DAY = 24 * 60 * 60 * 1000;
const DHAKA_OFFSET = 6 * 60 * 60 * 1000; // Bangladesh has no daylight saving

// "YYYY-MM-DD" of a moment in Dhaka time
const dhakaDay = (ms) => new Date(ms + DHAKA_OFFSET).toISOString().slice(0, 10);
const gmtMs = (order) => Date.parse(`${order.date_created_gmt}Z`);

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
  };
}

const LIST_FIELDS = ["id", "number", "status", "total", "date_created_gmt", "billing", "line_items"];

export async function loadOrderList({ status, page }) {
  try {
    const [{ orders, total, totalPages }, totals] = await Promise.all([
      getOrders({ page, perPage: 20, status, fields: LIST_FIELDS }),
      getOrderStatusTotals(),
    ]);
    return {
      orders: orders.map(orderSummary),
      total,
      totalPages,
      statuses: totals.map((s) => ({ slug: s.slug, name: s.name, total: Number(s.total) || 0 })),
    };
  } catch (error) {
    console.error("Admin orders failed:", error.message);
    return { error: CONNECTION_ERROR };
  }
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
        designNumber: name.match(/(\d+)\s*$/)?.[1] ?? "",
        image: p.images?.[0]?.src ?? null,
        price: p.price,
        manageStock: Boolean(p.manage_stock),
        stock: p.stock_quantity,
        stockStatus: p.stock_status,
        categories: (p.categories ?? []).map((c) => ({ id: c.slug, name: decodeEntities(c.name) })),
        status: p.status,
      };
    });
    return {
      products: rows,
      lowStock: rows.filter((p) => p.manageStock && p.stock !== null && p.stock <= LOW_STOCK),
      outOfStock: rows.filter((p) => p.stockStatus === "outofstock"),
      stockTracked: rows.some((p) => p.manageStock),
    };
  } catch (error) {
    console.error("Admin products failed:", error.message);
    return { error: CONNECTION_ERROR };
  }
}
