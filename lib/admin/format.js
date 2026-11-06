// Admin display helpers. Latin digits for clarity in tables; Bangla month names.
const NUMBER = new Intl.NumberFormat("en-IN");
const DATE = new Intl.DateTimeFormat("bn-BD-u-nu-latn", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Dhaka",
});
const DATE_TIME = new Intl.DateTimeFormat("bn-BD-u-nu-latn", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Dhaka",
});

export const num = (value) => NUMBER.format(Math.round(Number(value) || 0));
export const taka = (value) => `৳ ${num(value)}`;
export const percent = (value, digits = 1) => `${(Number(value) || 0).toFixed(digits)}%`;
export const date = (iso) => DATE.format(new Date(iso));
export const dateTime = (iso) => DATE_TIME.format(new Date(iso));

export function duration(seconds) {
  const s = Math.round(seconds);
  return s < 60 ? `${s} সেকেন্ড` : `${Math.floor(s / 60)} মিনিট ${s % 60} সেকেন্ড`;
}
