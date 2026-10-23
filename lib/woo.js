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
    per_page: String(perPage),
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
