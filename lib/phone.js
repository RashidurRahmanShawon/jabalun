// Shared by the checkout form (client) and /api/order (server) — no secrets here.

const BANGLA_DIGITS = "০১২৩৪৫৬৭৮৯";

// Bangladeshi mobile: 01 + operator digit 3-9 + 8 digits = 11 digits
export const PHONE_PATTERN = /^01[3-9]\d{8}$/;

// "+880 1৭১২-৩৪৫৬৭৮" -> "01712345678"
export function normalizePhone(input = "") {
  return String(input)
    .replace(/[০-৯]/g, (digit) => String(BANGLA_DIGITS.indexOf(digit)))
    .replace(/[\s-]/g, "")
    .replace(/^\+?88(?=01)/, "");
}

export function isValidPhone(input) {
  return PHONE_PATTERN.test(normalizePhone(input));
}
