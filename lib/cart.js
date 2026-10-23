// Browser cart stored in localStorage. Browser-only: server code imports limits from lib/site.js.
import { useMemo, useSyncExternalStore } from "react";
import { CART_EVENT, CART_KEY, CART_MAX_ITEMS, CART_MAX_QTY } from "@/lib/site";

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

// Returns { status: "added" | "increased" | "max" | "full", quantity }
export function addToCart(product) {
  const cart = readCart();
  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    if (existing.quantity >= MAX_QTY) return { status: "max", quantity: existing.quantity };
    existing.quantity += 1;
    writeCart(cart);
    return { status: "increased", quantity: existing.quantity };
  }

  if (cart.length >= MAX_ITEMS) return { status: "full", quantity: 0 };
  const { id, slug, name, price, image } = product;
  cart.push({ id, slug, name, price, image: image ?? null, quantity: 1 });
  writeCart(cart);
  return { status: "added", quantity: 1 };
}

export function setQuantity(id, quantity) {
  writeCart(readCart().map((item) => (item.id === id ? { ...item, quantity: clampQty(quantity) } : item)));
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
