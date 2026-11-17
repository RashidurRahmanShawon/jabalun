// SAMPLE DATA ONLY — analytics, delivery zones and the discount rule are not connected to the database yet.
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
