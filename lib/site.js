// Site-wide contact details — change them here only.
// Values starting with "[" are placeholders and are hidden on the site.
export const SITE = {
  siteName: "জাবালুন",
  email: "support@jabalun.com",
  // Shown on the contact page only; the rest of the site uses `email`
  contactEmail: "Yasin503509@gmail.com",
  phone: "+8801707406132",
  // Digits only, with country code (e.g. 8801XXXXXXXXX)
  whatsapp: "[হোয়াটসঅ্যাপ নম্বর]",
  address: "71 Gausul Azam Ave, Dhaka 1230",
};

export function hasValue(value) {
  return typeof value === "string" && value.trim() !== "" && !value.trim().startsWith("[");
}

export const CART_KEY = "jabalun_cart";
export const CART_EVENT = "jabalun:cart-updated";
// Enforced by the cart (browser) and by /api/order (server)
export const CART_MAX_QTY = 10;
export const CART_MAX_ITEMS = 20;
