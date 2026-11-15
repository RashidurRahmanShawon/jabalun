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
  const lineItems = (row.items || []).map((item, index) => {
    const qty = Number(item.quantity || 1);
    const prc = Number(item.price || 0);
    const productId = item.product_id ?? item.productId ?? item.id ?? null;
    return {
      id: `${productId ?? "item"}-${index}`,
      product_id: productId,
      name: decodeEntities(item.name || (productId ? `পণ্য #${productId}` : "পণ্য")),
      design_number: item.design_number || "",
      image: item.image || null,
      quantity: qty,
      price: prc,
      subtotal: String(prc * qty),
      total: String(prc * qty),
    };
  });
  const itemsSubtotal = lineItems.reduce((sum, item) => sum + Number(item.subtotal), 0);
  const subtotal = Number(row.subtotal) || itemsSubtotal;
  const discount = Number(row.discount || 0);
  const deliveryFee = Number(row.delivery_fee || 0);
  // Older orders were saved with total 0 — fall back to the item sum
  const total = Number(row.total) || Math.max(0, subtotal - discount + deliveryFee);
  const contact = {
    first_name: row.customer_name || "—",
    last_name: "",
    address_1: row.address || "—",
    phone: row.phone || "—",
  };

  return {
    id: row.id,
    number: row.number,
    order_key: row.order_key,
    status: row.status || "processing",
    subtotal: String(subtotal),
    discount: String(discount),
    delivery_fee: String(deliveryFee),
    total: String(total),
    payment_method: row.payment_method || "cod",
    payment_method_title: row.payment_method_title || "ক্যাশ অন ডেলিভারি",
    date_created_gmt: row.created_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    customer_note: row.note || "",
    source: row.source || "unknown",
    source_detail: row.source_detail || {},
    billing: contact,
    shipping: contact,
    line_items: lineItems,
    fee_lines: discount > 0 ? [{ id: "discount", name: "ছাড়", total: (-discount).toFixed(2) }] : [],
    shipping_lines: [
      { id: "shipping", method_title: deliveryFee > 0 ? "ডেলিভারি চার্জ" : "ফ্রি ডেলিভারি", total: String(deliveryFee) },
    ],
  };
}

// Orders placed before line items stored name/price only have { product_id, quantity }.
// Fill the gaps from the products table (current price) so admins can still see what was ordered.
async function fillLegacyItems(supabase, rows) {
  const missing = new Set();
  for (const row of rows) {
    for (const item of row.items || []) {
      const pid = item.product_id ?? item.productId;
      if (pid && (!item.name || !Number(item.price))) missing.add(Number(pid));
    }
  }
  if (missing.size === 0) return rows;

  const { data } = await supabase
    .from("products")
    .select("id, name, price, design_number, image_url")
    .in("id", [...missing]);
  const byId = new Map((data || []).map((p) => [p.id, p]));

  return rows.map((row) => ({
    ...row,
    items: (row.items || []).map((item) => {
      const product = byId.get(Number(item.product_id ?? item.productId));
      if (!product) return item;
      return {
        ...item,
        name: item.name || product.name,
        price: Number(item.price) || Number(product.price) || 0,
        design_number: item.design_number || product.design_number || "",
        image: item.image || product.image_url || null,
      };
    }),
  }));
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
  if (!supabase || !slug) return null;

  let decodedSlug = slug;
  try {
    decodedSlug = decodeURIComponent(slug);
  } catch {}

  const { data } = await supabase
    .from("categories")
    .select("slug")
    .or(`slug.eq."${decodedSlug}",slug.eq."${slug}"`)
    .maybeSingle();

  return data?.slug ?? decodedSlug ?? slug;
}

export async function getProductsByCategory(categorySlug, { perPage = 48 } = {}) {
  const supabase = getSupabaseServer();
  if (!supabase || !categorySlug) return [];

  let decodedCategorySlug = categorySlug;
  try {
    decodedCategorySlug = decodeURIComponent(categorySlug);
  } catch {}

  let query = supabase
    .from("products")
    .select("*")
    .eq("status", "publish")
    .order("id", { ascending: false })
    .limit(perPage);

  if (decodedCategorySlug === categorySlug) {
    query = query.eq("category_slug", decodedCategorySlug);
  } else {
    query = query.or(`category_slug.eq."${decodedCategorySlug}",category_slug.eq."${categorySlug}"`);
  }

  const { data, error } = await query;
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
  if (!supabase || !slug) return null;

  let decodedSlug = slug;
  try {
    decodedSlug = decodeURIComponent(slug);
  } catch {}

  // 1. Try decoded slug
  let { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", decodedSlug)
    .eq("status", "publish")
    .maybeSingle();

  // 2. If not found and raw slug is different, try raw slug
  if (!data && decodedSlug !== slug) {
    const res = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("status", "publish")
      .maybeSingle();
    data = res.data;
  }

  // 3. Fallback: if slug is numeric ID, query by ID
  if (!data && (/^\d+$/.test(decodedSlug) || /^\d+$/.test(slug))) {
    const idVal = Number(decodedSlug || slug);
    const res = await supabase
      .from("products")
      .select("*")
      .eq("id", idVal)
      .eq("status", "publish")
      .maybeSingle();
    data = res.data;
  }

  if (!data) return null;
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
  const { data, error } = await query.limit(1).maybeSingle();
  if (error || !data) return null;
  const [filled] = await fillLegacyItems(supabase, [data]);
  return formatOrder(filled);
}

function isMissingColumn(error) {
  const message = error?.message || "";
  return error?.code === "42703" || error?.code === "PGRST204" || (/source/.test(message) && /column/.test(message));
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

  const items = (payload.line_items || []).map((item) => ({
    product_id: item.product_id ?? item.productId,
    quantity: Number(item.quantity) || 1,
    name: item.name || "",
    price: Number(item.price) || 0,
    design_number: item.design_number || "",
    image: item.image || null,
    category: item.category || "",
  }));
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
    source: payload.source || "direct",
    source_detail: payload.source_detail || {},
  };

  let { data, error } = await supabase.from("orders").insert(orderData).select().single();

  // The source columns are added by a migration (supabase/schema.sql). Until it is run,
  // still save the order — just without its source.
  if (error && isMissingColumn(error)) {
    console.warn("orders.source columns missing — run the migration in supabase/schema.sql");
    const { source: _s, source_detail: _d, ...withoutSource } = orderData;
    ({ data, error } = await supabase.from("orders").insert(withoutSource).select().single());
  }

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

export async function getOrders({ page = 1, perPage = 20, status, after, before, source } = {}) {
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
  if (before) {
    countQuery = countQuery.lt("created_at", before);
    dataQuery = dataQuery.lt("created_at", before);
  }
  if (source) {
    // Orders saved before source tracking have no value: they count as "unknown"
    const filter = source === "unknown" ? "source.is.null,source.eq.unknown" : null;
    countQuery = filter ? countQuery.or(filter) : countQuery.eq("source", source);
    dataQuery = filter ? dataQuery.or(filter) : dataQuery.eq("source", source);
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

  const filled = await fillLegacyItems(supabase, data || []);
  return {
    orders: filled.map(formatOrder),
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
  if (error) console.error("Supabase updateOrderStatus error:", error.message);
  return !error;
}


// Light rows for the admin counters: when, status, total, source (newest first).
// Falls back to rows without source if the migration has not been run yet.
export async function getOrderStatsRows() {
  const supabase = getSupabaseServer();
  if (!supabase) return { rows: [], hasSource: false };
  let { data, error } = await supabase
    .from("orders")
    .select("created_at, status, total, source")
    .order("created_at", { ascending: false })
    .limit(10000);
  if (error && isMissingColumn(error)) {
    ({ data, error } = await supabase
      .from("orders")
      .select("created_at, status, total")
      .order("created_at", { ascending: false })
      .limit(10000));
    if (error) throw new Error(error.message);
    return { rows: data || [], hasSource: false };
  }
  if (error) throw new Error(error.message);
  return { rows: data || [], hasSource: true };
}

// All categories, oldest first (creation order decides each category's chart colour)
export async function getCategories() {
  const supabase = getSupabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase.from("categories").select("id, slug, name, description").order("id", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}
