import Link from "next/link";
import { getCategoryBySlug, getProducts, getProductsByCategory } from "@/lib/woo";
import ProductCard from "@/components/ProductCard";

export const metadata = {
  title: "শপ | জাবালুন",
  description: "জাবালুনের সব খিমার, প্লাজু সেট ও ইনস্ট্যান্ট রেডি হিজাব এক জায়গায়।",
};

// WooCommerce allows at most 100 per request; the store has fewer for now
const PER_PAGE = 500; // khimar alone has 100+ designs

const TABS = [
  { slug: "", label: "সব পণ্য" },
  { slug: "khimar-plazu-set", label: "খিমার প্লাজু সেট" },
  { slug: "instant-ready-hijab", label: "ইনস্ট্যান্ট রেডি হিজাব" },
];

const KNOWN_SLUGS = TABS.map((tab) => tab.slug).filter(Boolean);

async function loadProducts(slug) {
  try {
    if (!slug) {
      return { products: await getProducts({ perPage: PER_PAGE }), failed: false };
    }
    const categoryId = await getCategoryBySlug(slug);
    if (!categoryId) {
      console.warn(`Category not found: ${slug}`);
      return { products: [], failed: false };
    }
    return {
      products: await getProductsByCategory(categoryId, { perPage: PER_PAGE }),
      failed: false,
    };
  } catch (error) {
    console.error(`Failed to load shop products (${slug || "all"}):`, error.message);
    return { products: [], failed: true };
  }
}

export default async function ShopPage({ searchParams }) {
  const params = await searchParams;
  const requested = Array.isArray(params.category) ? params.category[0] : params.category;
  const activeSlug = KNOWN_SLUGS.includes(requested) ? requested : "";
  const { products, failed } = await loadProducts(activeSlug);

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-center text-3xl font-bold text-neutral-900">শপ</h1>

        <nav aria-label="ক্যাটাগরি" className="mt-6">
          <ul className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {TABS.map((tab) => {
              const active = tab.slug === activeSlug;
              return (
                <li key={tab.slug || "all"}>
                  <Link
                    href={tab.slug ? `/shop?category=${tab.slug}` : "/shop"}
                    aria-current={active ? "page" : undefined}
                    className={`inline-block rounded-full border px-4 py-2 text-sm font-semibold transition sm:px-6 sm:text-base ${
                      active
                        ? "border-black bg-black text-white"
                        : "border-neutral-300 text-neutral-800 hover:border-black"
                    }`}
                  >
                    {tab.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {!failed && products.length > 0 ? (
          <p className="mt-4 text-center text-sm text-neutral-500">
            মোট {products.length.toLocaleString("bn-BD")}টি পণ্য
          </p>
        ) : null}

        <div className="mt-8">
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-neutral-200 bg-white py-12 text-center text-neutral-500">
              {failed ? "এই মুহূর্তে পণ্য দেখানো যাচ্ছে না।" : "এই মুহূর্তে কোনো পণ্য নেই।"}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
