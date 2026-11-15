// SAMPLE DATA ONLY — the dashboard is not connected to WooCommerce or any database yet.
// Generated from a fixed seed and a fixed "today" so server and browser render the same.
import { calcDiscount } from "@/lib/discount";

export const MOCK_TODAY = "2026-11-02T18:00:00+06:00";
const DAY = 24 * 60 * 60 * 1000;

function seeded(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}
const rand = seeded(20261102);
const between = (min, max) => Math.floor(min + rand() * (max - min + 1));

export const ORDER_STATUSES = {
  new: { label: "নতুন", tone: "blue" },
  processing: { label: "প্রক্রিয়াধীন", tone: "amber" },
  shipped: { label: "পাঠানো হয়েছে", tone: "violet" },
  delivered: { label: "ডেলিভারি হয়েছে", tone: "green" },
  cancelled: { label: "বাতিল", tone: "red" },
};

export const PRODUCTS = [
  ...Array.from({ length: 10 }, (_, i) => ({
    id: 401 + i,
    name: `ইনস্ট্যান্ট রেডি হিজাব - ${401 + i}`,
    designNumber: String(401 + i),
    price: 790,
    stock: between(0, 40),
    category: "instant-ready-hijab",
    status: i === 7 ? "draft" : "published",
    sold: between(5, 120),
    description: "ভিসকস কটন ফেব্রিক — ইনস্ট্যান্ট রেডি হিজাব।",
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    id: 226 + i,
    name: `খিমার প্লাজু সেট - ${226 + i}`,
    designNumber: String(226 + i),
    price: 1090,
    stock: between(0, 25),
    category: "khimar-plazu-set",
    status: i === 3 ? "draft" : "published",
    sold: between(3, 60),
    description: "খিমার ও প্লাজুর মানানসই সেট।",
  })),
];

const AREAS = ["মিরপুর, ঢাকা", "উত্তরা, ঢাকা", "চট্টগ্রাম", "সিলেট", "রাজশাহী", "খুলনা", "গাজীপুর", "কুমিল্লা"];

export const CUSTOMERS = Array.from({ length: 8 }, (_, i) => ({
  id: `c${i + 1}`,
  name: `নমুনা গ্রাহক ${i + 1}`,
  phone: `017XXXXXX${String(i + 1).padStart(2, "0")}`, // clearly fake, never a real number
  address: `নমুনা ঠিকানা ${i + 1}, ${AREAS[i]}`,
}));

const STATUS_CYCLE = ["new", "new", "processing", "processing", "shipped", "delivered", "delivered", "delivered", "cancelled"];
const published = PRODUCTS.filter((product) => product.status === "published");

export const ORDERS = Array.from({ length: 24 }, (_, i) => {
  const customer = CUSTOMERS[between(0, CUSTOMERS.length - 1)];
  const lineCount = between(1, 3);
  const items = [];
  for (let n = 0; n < lineCount; n += 1) {
    const product = published[between(0, published.length - 1)];
    if (items.some((item) => item.productId === product.id)) continue;
    items.push({ productId: product.id, name: product.name, price: product.price, quantity: between(1, 2), category: product.category });
  }
  const { subtotal, discount, total } = calcDiscount(
    items.map((item) => ({ ...item, eligible: item.category === "instant-ready-hijab" }))
  );
  return {
    id: String(1024 - i),
    date: new Date(new Date(MOCK_TODAY).getTime() - i * 0.6 * DAY - between(0, 300) * 60000).toISOString(),
    customerId: customer.id,
    customerName: customer.name,
    phone: customer.phone,
    address: customer.address,
    items,
    subtotal,
    discount,
    total,
    payment: "ক্যাশ অন ডেলিভারি",
    status: STATUS_CYCLE[i % STATUS_CYCLE.length],
  };
});

export function customerSummary(customer) {
  const orders = ORDERS.filter((order) => order.customerId === customer.id && order.status !== "cancelled");
  return {
    ...customer,
    orderCount: orders.length,
    totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
    lastOrder: orders[0]?.date ?? null,
    orders,
  };
}

export const ANALYTICS = {
  kpis: { pageViews: 18640, uniqueVisitors: 6215, avgSessionSeconds: 154, bounceRate: 41.8 },
  funnel: [
    { label: "পণ্য দেখা", value: 4820 },
    { label: "কার্টে যোগ", value: 1210 },
    { label: "চেকআউট শুরু", value: 540 },
    { label: "অর্ডার সম্পন্ন", value: 212 },
  ],
  topClicks: [
    { name: "product-card-order", label: "পণ্য কার্ড — অর্ডার করুন", value: 2310 },
    { name: "collection-design", label: "সুতি হিজাব — ডিজাইন বাছাই", value: 1985 },
    { name: "add-to-cart", label: "কার্টে যোগ করুন", value: 1210 },
    { name: "buy-now", label: "এখনই কিনুন", value: 742 },
    { name: "home-all-designs", label: "হোম — সব ডিজাইন দেখুন", value: 655 },
    { name: "header-cart", label: "হেডার — কার্ট", value: 498 },
    { name: "nav-shop", label: "মেনু — শপ", value: 431 },
  ],
  fieldDropoff: [
    { field: "name", label: "নাম", value: 48 },
    { field: "address", label: "ঠিকানা", value: 121 },
    { field: "phone", label: "মোবাইল নম্বর", value: 83 },
  ],
  scrollDepth: [
    { depth: 25, value: 92 },
    { depth: 50, value: 71 },
    { depth: 75, value: 48 },
    { depth: 100, value: 27 },
  ],
  pageTime: [
    { path: "/product/ready-hijab-all-collection", label: "সুতি হিজাব — সব ডিজাইন", seconds: 214 },
    { path: "/product/[slug]", label: "পণ্য পেজ", seconds: 96 },
    { path: "/", label: "হোম", seconds: 72 },
    { path: "/cart", label: "কার্ট", seconds: 58 },
    { path: "/shop", label: "শপ", seconds: 64 },
    { path: "/about", label: "এবাউট", seconds: 31 },
  ],
};

export const DELIVERY_ZONES = [
  { id: "z1", area: "ঢাকা সিটি", charge: 0, days: "১–২ দিন" },
  { id: "z2", area: "ঢাকার আশেপাশে (গাজীপুর, নারায়ণগঞ্জ, সাভার)", charge: 0, days: "২–৩ দিন" },
  { id: "z3", area: "সারা বাংলাদেশ", charge: 0, days: "৩–৫ দিন" },
];

export const DISCOUNT_RULE = {
  label: "৩টি বা তার বেশি হিজাবে ১০%",
  category: "instant-ready-hijab",
  minQty: 3,
  percent: 10,
  active: true,
};
