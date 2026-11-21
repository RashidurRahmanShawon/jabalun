// Browser cart stored in localStorage. Browser-only: server code imports limits from lib/site.js.
import { useMemo, useSyncExternalStore } from "react";
import { CART_EVENT, CART_KEY, CART_MAX_ITEMS, CART_MAX_QTY } from "@/lib/site";
import { pixelTrack, productParams } from "@/lib/pixel";

export const MAX_QTY = CART_MAX_QTY;
export const MAX_ITEMS = CART_MAX_ITEMS;

function clampQty(value) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? Math.min(MAX_QTY, Math.max(1, n)) : 1;
}

// Old carts stored items without a quantity — treat those as 1
export function parseCart(raw) {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && Number.isInteger(item.id))
      .map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        price: item.price,
        image: item.image ?? null,
        quantity: clampQty(item.quantity ?? 1),
        hijab: Boolean(item.hijab), // discount preview only; the server re-checks
      }));
  } catch {
    return [];
  }
}

function readRaw() {
  try {
    return window.localStorage.getItem(CART_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

export function readCart() {
  return parseCart(readRaw());
}

// Throws if storage is blocked — callers show a message
function writeCart(items) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
}

// Meta Pixel AddToCart for the units just added (only when a quantity goes up)
function reportAdded(item, added) {
  if (added > 0) pixelTrack("AddToCart", productParams([{ id: item.id, price: item.price, quantity: added }]));
}

// Returns { status: "added" | "increased" | "max" | "full", quantity }
export function addToCart(product) {
  const cart = readCart();
  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    if (existing.quantity >= MAX_QTY) return { status: "max", quantity: existing.quantity };
    existing.quantity += 1;
    writeCart(cart);
    reportAdded(existing, 1);
    return { status: "increased", quantity: existing.quantity };
  }

  if (cart.length >= MAX_ITEMS) return { status: "full", quantity: 0 };
  cart.push(toCartItem(product, 1));
  writeCart(cart);
  reportAdded(product, 1);
  return { status: "added", quantity: 1 };
}

function toCartItem({ id, slug, name, price, image, hijab }, quantity) {
  return { id, slug, name, price, image: image ?? null, hijab: Boolean(hijab), quantity };
}

// Sets an exact quantity, adding the product if needed; 0 removes it.
// Returns "ok" or "full" (too many different products).
export function setItemQuantity(product, quantity) {
  const cart = readCart();
  const index = cart.findIndex((item) => item.id === product.id);

  if (quantity <= 0) {
    if (index !== -1) writeCart(cart.filter((item) => item.id !== product.id));
    return "ok";
  }
  const before = index === -1 ? 0 : cart[index].quantity;
  if (index === -1) {
    if (cart.length >= MAX_ITEMS) return "full";
    cart.push(toCartItem(product, clampQty(quantity)));
  } else {
    cart[index].quantity = clampQty(quantity);
  }
  writeCart(cart);
  reportAdded(product, clampQty(quantity) - before);
  return "ok";
}

export function setQuantity(id, quantity) {
  const cart = readCart();
  const item = cart.find((i) => i.id === id);
  writeCart(cart.map((i) => (i.id === id ? { ...i, quantity: clampQty(quantity) } : i)));
  if (item) reportAdded(item, clampQty(quantity) - item.quantity);
}

export function removeFromCart(id) {
  writeCart(readCart().filter((item) => item.id !== id));
}

export function clearCart() {
  writeCart([]);
}

function subscribe(onChange) {
  window.addEventListener(CART_EVENT, onChange);
  window.addEventListener("storage", onChange); // other tabs
  return () => {
    window.removeEventListener(CART_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// items is null during server render / hydration (cart not known yet)
export function useCart() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  return useMemo(() => (raw === null ? null : parseCart(raw)), [raw]);
}
