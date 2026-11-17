import { getCategoryBySlug, getProductsByCategory } from "@/lib/woo";
import { decodeEntities } from "@/lib/text";
import ProductCard from "@/components/ProductCard";
import CollectionPicker from "./CollectionPicker";

// Shared "all designs on one page" collection, used by
// /product/ready-hijab-all-collection and /product/khimar-plazu-all-collection.

const BANGLA_DIGITS = "০১২৩৪৫৬৭৮৯";

// "ইনস্ট্যান্ট রেডি হিজাব - 414" -> { number: 414, code: "414" }
// "খিমার প্লাজু সেট - KP104"     -> { number: 104, code: "KP104" }
function designCode(name) {
  const latin = name.replace(/[০-৯]/g, (digit) => String(BANGLA_DIGITS.indexOf(digit)));
  const match = latin.match(/([A-Za-z]*)(\d+)\s*$/);
  return match ? { number: Number(match[2]), code: `${match[1].toUpperCase()}${match[2]}` } : { number: null, code: null };
}

async function loadCategory(slug, perPage) {
  const categoryId = await getCategoryBySlug(slug);
  return categoryId ? getProductsByCategory(categoryId, { perPage }) : [];
}

async function loadDesigns(slug) {
  try {
    const products = await loadCategory(slug, 500); // every design (khimar has 100+)

    // Out-of-stock designs are left out here, so no stock data needs to reach the browser
    const designs = products
      .filter((product) => product.purchasable && product.stock_status !== "outofstock")
      .map((product) => {
        const name = decodeEntities(product.name || "");
        return {
          id: product.id,
          slug: product.slug,
          name,
          ...designCode(name),
          price: product.price,
          image: product.images?.[0]?.src ?? null,
          description: product.description || "",
        };
      });

    // By design number, ascending; products without a number go last
    designs.sort((a, b) => {
      if (a.number === null || b.number === null) {
        return a.number === b.number ? a.id - b.id : a.number === null ? 1 : -1;
      }
      return a.number - b.number;
    });

    return { designs, failed: false };
  } catch (error) {
    console.error(`Failed to load collection ${slug}:`, error.message);
    return { designs: [], failed: true };
  }
}

async function loadMore(slug) {
  try {
    return await loadCategory(slug, 10);
  } catch (error) {
    console.error(`Failed to load ${slug} products:`, error.message);
    return [];
  }
}

const HTML_CONTENT =
  "text-neutral-700 leading-relaxed [&_a]:underline [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_strong]:text-neutral-900 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5";

// config: { slug, name, tag, titleWithPrice(price), titleNoPrice, hijab, more: { slug, title } }
export default async function CollectionPage({ config }) {
  const [{ designs, failed }, more] = await Promise.all([loadDesigns(config.slug), loadMore(config.more.slug)]);

  const prices = [...new Set(designs.map((design) => design.price))];
  const samePrice = prices.length === 1 && prices[0] ? Number(prices[0]) : null;
  const title = samePrice ? config.titleWithPrice(samePrice) : config.titleNoPrice;
  // All designs share one description; show the first one that has it
  const description = designs.find((design) => design.description)?.description ?? "";
  // Only id, slug, name, code, price and image URL reach the client
  const pickerDesigns = designs.map(({ id, slug, name, code, price, image }) => ({ id, slug, name, code, price, image }));

  return (
    <main className="flex-1 bg-[#eef6ee]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        {designs.length > 0 ? (
          <CollectionPicker designs={pickerDesigns} title={title} price={samePrice} tag={config.tag} hijab={config.hijab} />
        ) : (
          <p className="rounded-xl border border-neutral-200 bg-white py-12 text-center text-neutral-500">
            {failed ? "এই মুহূর্তে পণ্য দেখানো যাচ্ছে না।" : "এই মুহূর্তে কোনো পণ্য নেই।"}
          </p>
        )}

        {description ? (
          <section className="mt-12 md:ml-auto md:w-1/2 md:pl-4">
            <h2 className="mb-4 text-2xl font-bold text-neutral-900">পণ্যের বিস্তারিত</h2>
            <div className={HTML_CONTENT} dangerouslySetInnerHTML={{ __html: description }} />
          </section>
        ) : null}

        {more.length > 0 ? (
          <section className="mt-16">
            <h2 className="mb-6 text-2xl font-bold text-neutral-900">{config.more.title}</h2>
            <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4">
              {more.map((product) => (
                <li key={product.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23.5%]">
                  <ProductCard product={product} sizes="(min-width: 1024px) 270px, (min-width: 640px) 31vw, 46vw" />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
