// Admin session token: "<expiry ms>.<HMAC-SHA256 signature>". The password itself is never
// stored in the cookie. The signing key is derived from ADMIN_PASSWORD, so changing the
// password logs everyone out. Used by proxy.js and lib/admin/session.js (server only —
// ADMIN_PASSWORD is not NEXT_PUBLIC_, so it is never available in the browser).
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "jabalun_admin";
export const SESSION_DAYS = 7;
export const MIN_PASSWORD_LENGTH = 12;

// "missing" | "short" | "ok"
export function passwordStatus() {
  const password = process.env.ADMIN_PASSWORD || "";
  if (!password) return "missing";
  return password.length < MIN_PASSWORD_LENGTH ? "short" : "ok";
}

function signingKey() {
  return passwordStatus() === "ok"
    ? createHmac("sha256", "jabalun-admin-session-v1").update(process.env.ADMIN_PASSWORD).digest()
    : null;
}

function sign(key, value) {
  return createHmac("sha256", key).update(value).digest("base64url");
}

function safeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function passwordMatches(input) {
  if (passwordStatus() !== "ok" || typeof input !== "string") return false;
  // Hash both sides first so the comparison is constant-time regardless of length
  const digest = (value) => createHmac("sha256", "jabalun-admin-compare").update(value).digest();
  return timingSafeEqual(digest(input), digest(process.env.ADMIN_PASSWORD));
}

export function createToken(now = Date.now()) {
  const key = signingKey();
  if (!key) return null;
  const expires = String(now + SESSION_DAYS * 24 * 60 * 60 * 1000);
  return `${expires}.${sign(key, expires)}`;
}

export function verifyToken(token) {
  try {
    const key = signingKey();
    if (!key || typeof token !== "string") return false;
    const [expires, signature] = token.split(".");
    if (!/^\d+$/.test(expires) || Number(expires) < Date.now() || !signature) return false;
    return safeEqual(signature, sign(key, expires));
  } catch {
    return false;
  }
}
