import "server-only";
import { getSupabaseServer } from "@/lib/supabase-server";
import { normalizePhone, PHONE_PATTERN } from "@/lib/phone";
import { dateRange } from "@/lib/admin/data";

// Customers are built from real orders, grouped by phone number, so every new order's customer
// shows up automatically. The optional `customers` table only holds what the admin edits
// (name/address, status, note, deleted). Orders themselves are never changed here.

const NOT_SALES = new Set(["cancelled", "failed", "refunded", "checkout-draft", "trash"]);
const ORDER_FIELDS = "id, number, created_at, status, total, customer_name, phone, address";

function isMissingTable(error) {
  return error?.code === "42P01" || error?.code === "PGRST205" || /customers/.test(error?.message || "");
}

async function readProfiles(supabase) {
  const { data, error } = await supabase.from("customers").select("*").limit(10000);
  if (error) {
    if (!isMissingTable(error)) console.error("Customer profiles failed:", error.message);
    return { profiles: new Map(), hasProfiles: false };
  }
  return { profiles: new Map((data || []).map((p) => [p.phone, p])), hasProfiles: true };
}

function buildCustomers(orders, profiles) {
  const byPhone = new Map();
  for (const order of orders) {
    const phone = normalizePhone(order.phone || "");
    if (!PHONE_PATTERN.test(phone)) continue;
    const entry = byPhone.get(phone) ?? { phone, orders: [] };
    entry.orders.push(order); // newest first (query order)
    byPhone.set(phone, entry);
  }
  // Profiles added by hand that have no orders yet
  for (const phone of profiles.keys()) {
    if (!byPhone.has(phone)) byPhone.set(phone, { phone, orders: [] });
  }

  const customers = [];
  for (const { phone, orders: list } of byPhone.values()) {
    const profile = profiles.get(phone);
    const latest = list[0];
    const lastMs = latest ? Date.parse(latest.created_at) : 0;
    // Deleted = hidden, until the customer places a new order after the deletion
    if (profile?.deleted_at && !(lastMs > Date.parse(profile.deleted_at))) continue;

    const sales = list.filter((o) => !NOT_SALES.has(o.status));
    customers.push({
      id: phone,
      phone,
      name: profile?.name || latest?.customer_name || "নাম নেই",
      address: profile?.address || latest?.address || "",
      status: profile?.status || "regular",
      note: profile?.note || "",
      orders: list,
      orderCount: list.length,
      salesCount: sales.length,
      totalSpent: sales.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
      firstOrder: list.length ? list[list.length - 1].created_at : null,
      lastOrder: latest?.created_at ?? null,
    });
  }
  return customers;
}

async function loadAll() {
  const supabase = getSupabaseServer();
  if (!supabase) throw new Error("Supabase is not configured");
  const [{ data: orders, error }, { profiles, hasProfiles }] = await Promise.all([
    supabase.from("orders").select(ORDER_FIELDS).order("created_at", { ascending: false }).limit(10000),
    readProfiles(supabase),
  ]);
  if (error) throw new Error(error.message);
  return { customers: buildCustomers(orders || [], profiles), hasProfiles };
}

const inRange = (iso, range) => {
  const ms = Date.parse(iso || "");
  return ms >= range.after && ms < range.before;
};

// date: "" | "today" | "week" | "month" | "YYYY-MM"; q: name / phone search
export async function loadCustomers({ date = "", q = "", status = "" } = {}) {
  try {
    const { customers, hasProfiles } = await loadAll();
    const range = date ? dateRange(date) : null;
    const query = q.trim().toLowerCase();
    const phoneQuery = normalizePhone(query);

    let rows = customers.map((c) => {
      if (!range) return { ...c, periodOrders: c.orderCount, periodSpent: c.totalSpent };
      const periodOrders = c.orders.filter((o) => inRange(o.created_at, range));
      return {
        ...c,
        periodOrders: periodOrders.length,
        periodSpent: periodOrders.filter((o) => !NOT_SALES.has(o.status)).reduce((s, o) => s + (Number(o.total) || 0), 0),
      };
    });
    if (range) rows = rows.filter((c) => c.periodOrders > 0);
    if (status) rows = rows.filter((c) => c.status === status);
    if (query) {
      rows = rows.filter(
        (c) => c.name.toLowerCase().includes(query) || (phoneQuery && c.phone.includes(phoneQuery))
      );
    }
    rows.sort((a, b) => b.periodSpent - a.periodSpent || Date.parse(b.lastOrder || 0) - Date.parse(a.lastOrder || 0));

    // Cards: customers who ordered today / this week / this month, and how many were first-timers
    const now = Date.now();
    const cards = {};
    for (const key of ["today", "week", "month"]) {
      const period = dateRange(key, now);
      const active = customers.filter((c) => c.orders.some((o) => inRange(o.created_at, period)));
      cards[key] = {
        customers: active.length,
        newCustomers: active.filter((c) => inRange(c.firstOrder, period)).length,
      };
    }

    const stats = {
      cards,
      customers: rows.length,
      // First order ever falls inside the period (all time: everyone is "new" once, so show repeaters instead)
      newCustomers: range ? rows.filter((c) => c.firstOrder && inRange(c.firstOrder, range)).length : null,
      repeat: rows.filter((c) => c.orderCount >= 2).length,
    };
    return { customers: rows.map(({ orders, ...rest }) => rest), stats, hasProfiles };
  } catch (error) {
    console.error("Admin customers failed:", error.message);
    return { error: "ডাটাবেসের সাথে সংযোগ করা যায়নি।" };
  }
}

export async function loadCustomer(phone) {
  try {
    const wanted = normalizePhone(phone || "");
    const { customers, hasProfiles } = await loadAll();
    const customer = customers.find((c) => c.phone === wanted) ?? null;
    return { customer, hasProfiles };
  } catch (error) {
    console.error("Admin customer failed:", error.message);
    return { error: "ডাটাবেসের সাথে সংযোগ করা যায়নি।" };
  }
}
