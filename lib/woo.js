import "server-only";

const API_BASE = "/wp-json/wc/v3";

function getConfig() {
  const url = process.env.WOO_URL;
  const key = process.env.WOO_CONSUMER_KEY;
  const secret = process.env.WOO_CONSUMER_SECRET;

  if (!url || !key || !secret) {
    throw new Error(
      "WooCommerce env missing: WOO_URL, WOO_CONSUMER_KEY, WOO_CONSUMER_SECRET"
    );
  }

  // WOO_URL may be given with or without protocol / trailing slash
  const host = url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  return { host, auth };
}

export async function wooFetch(path, options = {}) {
  const { host, auth } = getConfig();
  const { headers, ...rest } = options;

  const res = await fetch(`https://${host}${API_BASE}${path}`, {
    cache: "no-store",
    ...rest,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const error = new Error(
      `WooCommerce ${res.status} ${res.statusText} for ${path}: ${body.slice(0, 300)}`
    );
    error.status = res.status;
    throw error;
  }

  return res.json();
}

export async function getProducts({ perPage = 48 } = {}) {
  const params = new URLSearchParams({
    status: "publish",
    orderby: "id",
    order: "desc",
    per_page: String(perPage),
  });

  // cache: undefined overrides the no-store default so revalidate takes effect
  return wooFetch(`/products?${params}`, {
    cache: undefined,
    next: { revalidate: 300 },
  });
}

export async function getCategoryBySlug(slug) {
  const params = new URLSearchParams({ slug });

  // Revalidated like products so the lookup doesn't force the page dynamic
  const categories = await wooFetch(`/products/categories?${params}`, {
    cache: undefined,
    next: { revalidate: 300 },
  });
  return categories[0]?.id ?? null;
}

export async function getProductsByCategory(categoryId, { perPage = 48 } = {}) {
  const params = new URLSearchParams({
    category: String(categoryId),
    status: "publish",
    orderby: "id",
    order: "desc",
    per_page: String(Math.min(perPage, 100)), // WooCommerce maximum
  });

  return wooFetch(`/products?${params}`, {
    cache: undefined,
    next: { revalidate: 300 },
  });
}

// Newest products from the same category, excluding the current one
export async function getRelatedProducts({ categoryId, excludeId, perPage = 5 }) {
  const params = new URLSearchParams({
    category: String(categoryId),
    exclude: String(excludeId),
    status: "publish",
    orderby: "id",
    order: "desc",
    per_page: String(perPage),
  });

  return wooFetch(`/products?${params}`, {
    cache: undefined,
    next: { revalidate: 300 },
  });
}

export async function getProductBySlug(slug) {
  const params = new URLSearchParams({ slug, status: "publish" });
  // Cached for the product page; /api/order re-checks stock via getProductById (no-store)
  const products = await wooFetch(`/products?${params}`, {
    cache: undefined,
    next: { revalidate: 300 },
  });
  return products[0] ?? null;
}

// Returns null when the product doesn't exist (404)
export async function getProductById(id) {
  try {
    return await wooFetch(`/products/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

// Fresh (uncached) data for many products in one call — used for cart and orders
export async function getProductsByIds(ids) {
  if (ids.length === 0) return [];
  const params = new URLSearchParams({
    include: ids.join(","),
    per_page: String(Math.min(ids.length, 100)),
  });
  return wooFetch(`/products?${params}`, { cache: "no-store" });
}

// Returns null when the order doesn't exist (404)
export async function getOrder(id) {
  try {
    return await wooFetch(`/orders/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

export async function createOrder(payload) {
  return wooFetch("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---- Admin dashboard (read-only) ----------------------------------------------

// Like wooFetch, but also returns WooCommerce's paging headers
async function wooList(path) {
  const { host, auth } = getConfig();
  const res = await fetch(`https://${host}${API_BASE}${path}`, {
    cache: "no-store",
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) {
    const error = new Error(`WooCommerce ${res.status} ${res.statusText} for ${path}`);
    error.status = res.status;
    throw error;
  }
  return {
    items: await res.json(),
    total: Number(res.headers.get("x-wp-total")) || 0,
    totalPages: Number(res.headers.get("x-wp-totalpages")) || 1,
  };
}

// Newest first. after: ISO date (UTC). fields: optional list for _fields to keep responses small.
export async function getOrders({ page = 1, perPage = 20, status, after, fields } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(Math.min(perPage, 100)),
    orderby: "date",
    order: "desc",
  });
  if (status) params.set("status", status);
  if (after) {
    params.set("after", after);
    params.set("dates_are_gmt", "true");
  }
  if (fields) params.set("_fields", fields.join(","));
  const { items, total, totalPages } = await wooList(`/orders?${params}`);
  return { orders: items, total, totalPages };
}

// Order count per status, including statuses added by plugins: [{ slug, name, total }]
export async function getOrderStatusTotals() {
  return wooFetch("/reports/orders/totals", { cache: "no-store" });
}

// All products in every status (publish, draft, private, ...) for the admin list
export async function getAdminProducts({ maxPages = 5 } = {}) {
  const all = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const params = new URLSearchParams({
      status: "any",
      orderby: "id",
      order: "desc",
      per_page: "100",
      page: String(page),
    });
    const { items, totalPages } = await wooList(`/products?${params}`);
    all.push(...items);
    if (page >= totalPages) break;
  }
  return all;
}
