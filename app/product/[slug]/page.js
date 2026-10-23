import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/woo";
import { decodeEntities, formatTaka, stripTags } from "@/lib/text";
import ProductCard from "@/components/ProductCard";
import ProductActions from "./ProductActions";

export const revalidate = 300;

// Empty list: nothing prerendered at build; each product page is rendered on
// first visit and then cached (ISR) for `revalidate` seconds
export async function generateStaticParams() {
  return [];
}

// Shared between generateMetadata and the page so WooCommerce is called once
const loadProduct = cache(getProductBySlug);

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return { title: "পণ্য পাওয়া যায়নি — জাবালুন" };

  return {
    title: `${decodeEntities(product.name)} — জাবালুন`,
    description: stripTags(product.short_description || product.description).slice(0, 160),
  };
}

// Same-category products only; never breaks the page (empty list on failure)
async function loadRelated(product) {
  const category = product.categories?.find((c) => c.slug !== "uncategorized");
  if (!category) return [];
  try {
    return await getRelatedProducts({ categoryId: category.id, excludeId: product.id });
  } catch (error) {
    console.error(`Failed to load related products for ${product.slug}:`, error.message);
    return [];
  }
}

const HTML_CONTENT =
  "text-neutral-700 leading-relaxed [&_a]:underline [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5";

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) notFound();

  const related = await loadRelated(product);
  const name = decodeEntities(product.name);
  const image = product.images?.[0];
  const inStock = product.purchasable && product.stock_status !== "outofstock";

  // Only these fields reach the client bundle
  const clientProduct = {
    id: product.id,
    slug: product.slug,
    name,
    price: product.price,
    image: image?.src ?? null,
  };

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        <Link href="/" className="text-sm text-neutral-500 hover:text-black">
          ← হোমে ফিরে যান
        </Link>

        <div className="mt-4 grid gap-8 md:grid-cols-2 md:gap-12">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-200">
            {image?.src ? (
              <Image
                src={image.src}
                alt={image.alt || name}
                fill
                priority
                sizes="(min-width: 1152px) 560px, (min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-500">
                ছবি নেই
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">{name}</h1>

            <div className="mt-3 flex items-baseline gap-3">
              {product.price ? (
                <span className="text-2xl font-bold text-neutral-900">
                  মূল্য: {formatTaka(product.price)}
                </span>
              ) : null}
              {product.on_sale && product.regular_price ? (
                <span className="text-lg text-neutral-400 line-through">
                  {formatTaka(product.regular_price)}
                </span>
              ) : null}
            </div>

            {product.short_description ? (
              <div
                className={`mt-5 ${HTML_CONTENT}`}
                dangerouslySetInnerHTML={{ __html: product.short_description }}
              />
            ) : null}

            <p className="mt-5 rounded-lg bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-700">
              ক্যাশ অন ডেলিভারি • সম্পূর্ণ বাংলাদেশে ফ্রি ডেলিভারি
            </p>

            <div className="mt-6">
              <ProductActions product={clientProduct} inStock={inStock} />
            </div>

            {product.description ? (
              <section className="mt-10 border-t border-neutral-200 pt-6">
                <h2 className="mb-3 text-lg font-semibold text-neutral-900">পণ্যের বিবরণ</h2>
                <div
                  className={HTML_CONTENT}
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </section>
            ) : null}
          </div>
        </div>

        {related.length > 0 ? (
          <section className="mt-16 border-t border-neutral-200 pt-10">
            <h2 className="mb-6 text-2xl font-bold text-neutral-900">সম্পর্কিত পণ্য</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
              {related.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  sizes="(min-width: 1152px) 220px, (min-width: 1024px) 20vw, 50vw"
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
