import { getProductsByIds } from "@/lib/woo";
import { CART_MAX_ITEMS as MAX_ITEMS } from "@/lib/site";
import { isDiscountProduct } from "@/lib/discount";

// GET /api/cart?ids=1,2,3 — current public price and availability for cart items.
// Returns only public product data; no keys or customer data.
export async function GET(request) {
  const raw = new URL(request.url).searchParams.get("ids") ?? "";
  const ids = [...new Set(raw.split(",").map(Number))].filter(
    (id) => Number.isInteger(id) && id > 0
  );

  if (ids.length === 0 || ids.length > MAX_ITEMS) {
    return Response.json({ error: "অনুরোধটি সঠিক নয়।" }, { status: 400 });
  }

  try {
    const products = await getProductsByIds(ids);
    const items = products
      .filter((product) => product.status === "publish")
      .map((product) => ({
        id: product.id,
        price: product.price,
        inStock: Boolean(product.purchasable) && product.stock_status !== "outofstock",
        eligible: isDiscountProduct(product.categories),
      }));
    return Response.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Cart price lookup failed:", error.message);
    return Response.json({ error: "দাম যাচাই করা যায়নি।" }, { status: 502 });
  }
}
