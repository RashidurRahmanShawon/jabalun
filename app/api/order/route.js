import { createOrder, getProductsByIds } from "@/lib/woo";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { decodeEntities } from "@/lib/text";
import { CART_MAX_ITEMS as MAX_ITEMS, CART_MAX_QTY as MAX_QTY } from "@/lib/site";

const MAX_NAME = 100;
const MAX_ADDRESS = 300;

const GENERIC_ERROR = "দুঃখিত, অর্ডারটি সম্পন্ন করা যায়নি। একটু পরে আবার চেষ্টা করুন।";

function fail(message, status = 400) {
  return Response.json({ error: message }, { status });
}

function cleanText(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

// Accepts { items: [{ productId, quantity }] } or the older { productId }.
// Returns merged [{ productId, quantity }] or null when invalid.
function parseItems(body) {
  const raw = Array.isArray(body.items)
    ? body.items
    : body.productId !== undefined
      ? [{ productId: body.productId, quantity: 1 }]
      : null;
  if (!raw || raw.length === 0 || raw.length > MAX_ITEMS) return null;

  const merged = new Map();
  for (const item of raw) {
    const productId = Number(item?.productId);
    const quantity = Number(item?.quantity ?? 1);
    if (!Number.isInteger(productId) || productId <= 0) return null;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) return null;
    merged.set(productId, Math.min(MAX_QTY, (merged.get(productId) ?? 0) + quantity));
  }
  return [...merged].map(([productId, quantity]) => ({ productId, quantity }));
}

// Returns an error message for the first item that can't be ordered, or null
function findUnavailable(items, products) {
  const byId = new Map(products.map((product) => [product.id, product]));

  for (const { productId, quantity } of items) {
    const product = byId.get(productId);
    if (
      !product ||
      product.status !== "publish" ||
      !product.purchasable ||
      product.stock_status === "outofstock"
    ) {
      return product
        ? `"${decodeEntities(product.name)}" এই মুহূর্তে অর্ডার করা যাচ্ছে না।`
        : "একটি পণ্য এই মুহূর্তে অর্ডার করা যাচ্ছে না।";
    }
    const limitedStock =
      product.manage_stock && product.stock_quantity !== null && product.backorders === "no";
    if (limitedStock && quantity > product.stock_quantity) {
      return `"${decodeEntities(product.name)}" স্টকে মাত্র ${Number(product.stock_quantity).toLocaleString("bn-BD")}টি আছে।`;
    }
  }
  return null;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("অনুরোধটি সঠিক নয়।");
  }
  if (!body || typeof body !== "object") return fail("অনুরোধটি সঠিক নয়।");

  // Honeypot: hidden field that only bots fill in
  if (cleanText(body.website)) return fail(GENERIC_ERROR);

  const items = parseItems(body);
  const name = cleanText(body.name);
  const address = cleanText(body.address);
  const phone = normalizePhone(cleanText(body.phone));

  if (!items) {
    return fail("পণ্যটি সঠিক নয়।");
  }
  if (!name || !address || !phone) {
    return fail("নাম, ঠিকানা ও মোবাইল নম্বর — তিনটিই দিতে হবে।");
  }
  if (name.length > MAX_NAME || address.length > MAX_ADDRESS) {
    return fail("নাম বা ঠিকানা অনেক বড় হয়ে গেছে।");
  }
  if (!isValidPhone(phone)) {
    return fail("সঠিক মোবাইল নম্বর দিন (যেমন 01XXXXXXXXX)।");
  }

  try {
    // Never trust the client: confirm every product can actually be ordered
    const products = await getProductsByIds(items.map((item) => item.productId));
    const problem = findUnavailable(items, products);
    if (problem) return fail(problem, 409);

    const contact = {
      first_name: name,
      address_1: address,
      phone,
      country: "BD",
    };

    const order = await createOrder({
      payment_method: "cod",
      payment_method_title: "ক্যাশ অন ডেলিভারি",
      set_paid: false,
      status: "processing",
      billing: contact,
      shipping: contact,
      line_items: items.map(({ productId, quantity }) => ({ product_id: productId, quantity })),
      shipping_lines: [
        { method_id: "free_shipping", method_title: "ফ্রি ডেলিভারি", total: "0" },
      ],
    });

    return Response.json({ id: order.id, order_key: order.order_key });
  } catch (error) {
    console.error("Order creation failed:", error.message);
    return fail(GENERIC_ERROR, 502);
  }
}
