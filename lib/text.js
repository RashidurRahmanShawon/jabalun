// WooCommerce returns product names with HTML entities (e.g. &#8211;)
export function decodeEntities(text = "") {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function stripTags(html = "") {
  return decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

// "1250.00" -> "1,250 ৳"
export function formatTaka(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "";
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })} ৳`;
}
