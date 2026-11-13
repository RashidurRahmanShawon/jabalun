import "server-only";
import { getSupabaseServer } from "./supabase-server";
import { decodeEntities } from "./text";

function formatProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    designNumber: row.design_number || "",
    price: String(row.price),
    regular_price: String(row.regular_price || row.price),
    status: row.status || "publish",
    purchasable: (row.stock ?? 1) > 0,
    stock_status: (row.stock ?? 1) > 0 ? "instock" : "outofstock",
    stock_quantity: row.stock ?? 50,
    manage_stock: true,
    description: row.description || "",
    short_description: row.short_description || row.description || "",
    categories: [
      { id: row.category_slug, slug: row.category_slug, name: row.category_name || row.category_slug },
    ],
    images: row.image_url ? [{ src: row.image_url, alt: row.name }] : [],
  };
}

function formatOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    number: row.number,
    order_key: row.order_key,
    status: row.status || "processing",
    total: String(row.total || 0),
    date_created_gmt: row.created_at,
    created_at: row.created_at,
    customer_note: row.note || "",
    billing: {
      first_name: row.customer_name || "—",
      last_name: "",
      address_1: row.address || "—",
      phone: row.phone || "—",
    },
    shipping: {
      first_name: row.customer_name || "—",
      last_name: "",
      address_1: row.address || "—",
      phone: row.phone || "—",
    },
    line_items: (row.items || []).map((item) => {
      const qty = Number(item.quantity || 1);
      const prc = Number(item.price || 0);
      return {
        id: item.productId || item.id,
        product_id: item.productId || item.id,
        name: decodeEntities(item.name || "পণ্য"),
        quantity: qty,
        price: prc,
        subtotal: String(prc * qty),
        total: String(prc * qty),
      };
    }),
    fee_lines: Number(row.discount || 0) > 0
      ? [{ name: "ছাড়", total: (-Number(row.discount)).toFixed(2) }]
      : [],
    shipping_lines: [
      { method_title: "ফ্রি ডেলিভারি", total: String(row.delivery_fee || 0) },
    ],
  };
}

export async function getProducts({ perPage = 48 } = {}) {
  const supabase = getSupabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "publish")
    .order("id", { ascending: false })
    .limit(perPage);
  if (error) {
    console.error("Supabase getProducts error:", error.message);
    return [];
  }
  return (data || []).map(formatProduct);
}

export async function getCategoryBySlug(slug) {
  const supabase = getSupabaseServer();
  if (!supabase) return null;
  const { data } = await supabase
    .from("categories")
    .select("slug")
    .eq("slug", slug)
    .single();
  return data?.slug ?? slug;
}

export async function getProductsByCategory(categorySlug, { perPage = 48 } = {}) {
  const supabase = getSupabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category_slug", categorySlug)
    .eq("status", "publish")
    .order("id", { ascending: false })
    .limit(perPage);
  if (error) {
    console.error(`Supabase getProductsByCategory (${categorySlug}) error:`, error.message);
    return [];
  }
  return (data || []).map(formatProduct);
}

export async function getRelatedProducts({ categoryId, excludeId, perPage = 5 }) {
  const supabase = getSupabaseServer();
  if (!supabase) return [];
  let query = supabase
    .from("products")
    .select("*")
    .eq("status", "publish")
    .neq("id", excludeId)
    .order("id", { ascending: false })
    .limit(perPage);
  if (categoryId) {
    query = query.eq("category_slug", categoryId);
  }
  const { data, error } = await query;
  if (error) {
    console.error("Supabase getRelatedProducts error:", error.message);
    return [];
  }
  return (data || []).map(formatProduct);
}

export async function getProductBySlug(slug) {
  const supabase = getSupabaseServer();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("status", "publish")
    .single();
  if (error || !data) return null;
  return formatProduct(data);
}

export async function getProductById(id) {
  const supabase = getSupabaseServer();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return formatProduct(data);
}

export async function getProductsByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const supabase = getSupabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .in("id", ids);
  if (error) {
    console.error("Supabase getProductsByIds error:", error.message);
    return [];
  }
  return (data || []).map(formatProduct);
}

export async function getOrder(id) {
  const supabase = getSupabaseServer();
  if (!supabase) return null;
  let query = supabase.from("orders").select("*");
  if (/^\d+$/.test(String(id))) {
    query = query.or(`id.eq.${id},number.eq.${id}`);
  } else {
    query = query.eq("number", String(id));
  }
  const { data, error } = await query.single();
  if (error || !data) return null;
  return formatOrder(data);
}

export async function createOrder(payload) {
  const supabase = getSupabaseServer();
  if (!supabase) throw new Error("Supabase is not configured.");

  const now = Date.now();
  const orderNumber = String(now).slice(-6);
  const orderKey = `wc_order_${Math.random().toString(36).slice(2, 12)}`;

  const billing = payload.billing || {};
  const customerName = [billing.first_name, billing.last_name].filter(Boolean).join(" ") || "সম্মানিত ক্রেতা";
  const phone = billing.phone || "";
  const address = billing.address_1 || "";
  const note = payload.customer_note || "";

  const items = payload.line_items || [];
  let subtotal = 0;
  for (const item of items) {
    subtotal += (Number(item.price) || 0) * (Number(item.quantity) || 1);
  }

  let discount = 0;
  for (const fee of payload.fee_lines || []) {
    const feeVal = Number(fee.total) || 0;
    if (feeVal < 0) discount += Math.abs(feeVal);
  }

  const deliveryFee = 0;
  const total = Math.max(0, subtotal - discount + deliveryFee);

  const orderData = {
    number: orderNumber,
    order_key: orderKey,
    customer_name: customerName,
    phone,
    address,
    note,
    items,
    subtotal,
    discount,
    delivery_fee: deliveryFee,
    total,
    status: payload.status || "processing",
    payment_method: payload.payment_method || "cod",
    payment_method_title: payload.payment_method_title || "ক্যাশ অন ডেলিভারি",
  };

  const { data, error } = await supabase
    .from("orders")
    .insert(orderData)
    .select()
    .single();

  if (error) {
    console.error("Supabase createOrder error:", error.message);
    throw new Error(`Order insertion failed: ${error.message}`);
  }

  // Decrement stock
  for (const item of items) {
    const pid = item.productId || item.product_id;
    if (pid) {
      try {
        const { data: prod } = await supabase
          .from("products")
          .select("stock")
          .eq("id", pid)
          .single();
        if (prod && prod.stock !== null) {
          const newStock = Math.max(0, prod.stock - Number(item.quantity || 1));
          await supabase
            .from("products")
            .update({ stock: newStock })
            .eq("id", pid);
        }
      } catch (err) {
        console.warn("Stock decrement warning:", err.message);
      }
    }
  }

  return formatOrder(data);
}

export async function getOrders({ page = 1, perPage = 20, status, after } = {}) {
  const supabase = getSupabaseServer();
  if (!supabase) return { orders: [], total: 0, totalPages: 1 };

  let countQuery = supabase.from("orders").select("*", { count: "exact", head: true });
  let dataQuery = supabase.from("orders").select("*");

  if (status) {
    countQuery = countQuery.eq("status", status);
    dataQuery = dataQuery.eq("status", status);
  }
  if (after) {
    countQuery = countQuery.gte("created_at", after);
    dataQuery = dataQuery.gte("created_at", after);
  }

  const { count } = await countQuery;
  const total = count || 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const start = (page - 1) * perPage;
  const { data, error } = await dataQuery
    .order("created_at", { ascending: false })
    .range(start, start + perPage - 1);

  if (error) {
    console.error("Supabase getOrders error:", error.message);
    return { orders: [], total: 0, totalPages: 1 };
  }

  return {
    orders: (data || []).map(formatOrder),
    total,
    totalPages,
  };
}

export async function getOrderStatusTotals() {
  const supabase = getSupabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase.from("orders").select("status");
  if (error || !data) return [];

  const counts = new Map();
  for (const row of data) {
    const s = row.status || "processing";
    counts.set(s, (counts.get(s) || 0) + 1);
  }

  return [...counts.entries()].map(([slug, count]) => ({
    slug,
    name: slug,
    total: count,
  }));
}

export async function getAdminProducts() {
  const supabase = getSupabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: false });
  if (error) {
    console.error("Supabase getAdminProducts error:", error.message);
    return [];
  }
  return (data || []).map(formatProduct);
}

export async function updateOrderStatus(orderId, newStatus) {
  const supabase = getSupabaseServer();
  if (!supabase) return false;
  const { error } = await supabase
    .from("orders")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", orderId);
  return !error;
}

