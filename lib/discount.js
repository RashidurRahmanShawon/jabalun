// Bulk discount shared by the browser (preview) and /api/order (the real order).
// 3+ items from the instant-ready-hijab category → 10% off those items only.

export const DISCOUNT_CATEGORY_SLUG = "instant-ready-hijab";
export const DISCOUNT_MIN_QTY = 3;
export const DISCOUNT_RATE = 0.1;
export const DISCOUNT_LABEL = "৩টি বা তার বেশি নিলে ১০% ছাড়";

const round2 = (value) => Math.round(value * 100) / 100;

export function isDiscountProduct(categories = []) {
  return categories.some((category) => category?.slug === DISCOUNT_CATEGORY_SLUG);
}

// items: [{ price, quantity, eligible }]
export function calcDiscount(items) {
  let subtotal = 0;
  let eligibleQty = 0;
  let eligibleSubtotal = 0;

  for (const item of items) {
    const line = Number(item.price || 0) * item.quantity;
    subtotal += line;
    if (item.eligible) {
      eligibleQty += item.quantity;
      eligibleSubtotal += line;
    }
  }

  const discount = eligibleQty >= DISCOUNT_MIN_QTY ? round2(eligibleSubtotal * DISCOUNT_RATE) : 0;
  return { subtotal: round2(subtotal), discount, total: round2(subtotal - discount), eligibleQty };
}
