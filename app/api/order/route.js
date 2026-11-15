import { createOrder, getProductsByIds } from "@/lib/woo";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { decodeEntities } from "@/lib/text";
import { calcDiscount, DISCOUNT_LABEL, isDiscountProduct } from "@/lib/discount";
import { classifySource, sanitizeSource } from "@/lib/order-source";
import { CART_MAX_ITEMS as MAX_ITEMS, CART_MAX_QTY as MAX_QTY } from "@/lib/site";
import { findRecentDuplicates, hashClientIp } from "@/lib/duplicate";

const DUPLICATE_MESSAGE = "আপনি সম্প্রতি একটি অর্ডার করেছেন। আগের অর্ডারটি নিশ্চিত করতে আমরা আবার জিজ্ঞেস করছি।";

const MAX_NAME = 100;
const MAX_ADDRESS = 300;
const MAX_NOTE = 300;

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
  const note = cleanText(body.note); // optional

  if (!items) {
    return fail("পণ্যটি সঠিক নয়।");
  }
  if (!name || !address || !phone) {
    return fail("নাম, ঠিকানা ও মোবাইল নম্বর — তিনটিই দিতে হবে।");
  }
  if (name.length > MAX_NAME || address.length > MAX_ADDRESS) {
    return fail("নাম বা ঠিকানা অনেক বড় হয়ে গেছে।");
  }
  if (note.length > MAX_NOTE) {
    return fail("নোট ৩০০ অক্ষরের মধ্যে লিখুন।");
  }
  if (!isValidPhone(phone)) {
    return fail("সঠিক মোবাইল নম্বর দিন (যেমন 01XXXXXXXXX)।");
  }

  try {
    // Never trust the client: confirm every product can actually be ordered
    const products = await getProductsByIds(items.map((item) => item.productId));
    const problem = findUnavailable(items, products);
    if (problem) return fail(problem, 409);

    // Discount is calculated from WooCommerce prices, never from the client
    const byId = new Map(products.map((product) => [product.id, product]));
    const { discount } = calcDiscount(
      items.map(({ productId, quantity }) => {
        const product = byId.get(productId);
        return { price: product.price, quantity, eligible: isDiscountProduct(product.categories) };
      })
    );

    const contact = {
      first_name: name,
      address_1: address,
      phone,
      country: "BD",
    };

    // Same phone in the last 60 minutes? Active order -> ask first (409), unless the customer confirmed.
    // Order details go back only when the IP hash matches too, so a phone number alone reveals nothing.
    const ipHash = hashClientIp(request.headers);
    const duplicates = await findRecentDuplicates({ phone, ipHash });
    const warningInactive = duplicates.recentInactiveMatches.length > 0;
    if (duplicates.activeMatches.length > 0 && body.acknowledgedDuplicate !== true) {
      return Response.json(
        {
          error: DUPLICATE_MESSAGE,
          duplicate: true,
          orders: duplicates.activeMatches.filter((m) => m.ipMatch).map((m) => m.summary),
          warningInactive,
        },
        { status: 409 }
      );
    }

    const sourceDetail = sanitizeSource(body.source);
    const { source, paid } = classifySource(sourceDetail);

    const order = await createOrder({
      source,
      source_detail: { ...sourceDetail, paid, ...(ipHash && { ip_hash: ipHash }) },
      payment_method: "cod",
      payment_method_title: "ক্যাশ অন ডেলিভারি",
      set_paid: false,
      status: "processing",
      billing: contact,
      shipping: contact,
      ...(note && { customer_note: note }),
      // Snapshot name/price at order time so the order stays correct if the product changes later
      line_items: items.map(({ productId, quantity }) => {
        const product = byId.get(productId);
        return {
          product_id: productId,
          quantity,
          name: decodeEntities(product.name),
          price: Number(product.price) || 0,
          design_number: product.designNumber || "",
          image: product.images?.[0]?.src || null,
          category: product.categories?.[0]?.slug || "",
        };
      }),
      shipping_lines: [
        { method_id: "free_shipping", method_title: "ফ্রি ডেলিভারি", total: "0" },
      ],
      ...(discount > 0 && {
        fee_lines: [{ name: DISCOUNT_LABEL, total: (-discount).toFixed(2), tax_status: "none" }],
      }),
    });

    return Response.json({ id: order.id, order_key: order.order_key, ...(warningInactive && { warningInactive: true }) });
  } catch (error) {
    console.error("Order creation failed:", error.message);
    return fail(GENERIC_ERROR, 502);
  }
}
