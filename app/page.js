import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import { getCategoryBySlug, getProductsByCategory } from "@/lib/woo";
import ProductCard from "@/components/ProductCard";

export const revalidate = 300;

const HAS_HERO_IMAGE = fs.existsSync(
  path.join(process.cwd(), "public", "images", "hero.jpg")
);

const FEATURES = [
  { icon: "🚚", title: "সম্পূর্ণ বাংলাদেশ জুড়ে ফ্রি ডেলিভারি" },
  { icon: "⭐", title: "সর্বোচ্চ মানের পণ্য" },
  { icon: "🏷️", title: "সর্বোত্তম মূল্য এবং অফার" },
  { icon: "🔒", title: "নিরাপদ পেমেন্ট" },
];

// Order matters: a product in both categories is shown only in the first
const SECTIONS = [
  {
    id: "khimar-plazu-set",
    slug: "khimar-plazu-set",
    title: "খিমার প্লাজু সেট",
    description: "খিমার ও প্লাজুর মানানসই সেট — একসাথে পরুন, পূর্ণ পর্দা ও আরামে।",
  },
  {
    id: "instant-ready-hijab",
    slug: "instant-ready-hijab",
    title: "ইনস্ট্যান্ট রেডি হিজাব",
    description: "পিন বা ঝামেলা ছাড়াই মুহূর্তেই পরে নিন — আরামদায়ক কাপড়ে তৈরি রেডি হিজাব।",
    allDesignsHref: "/product/ready-hijab-all-collection",
  },
];

async function loadCategoryProducts(slug) {
  try {
    const categoryId = await getCategoryBySlug(slug);
    if (!categoryId) {
      // Category not created in WooCommerce yet: treat as empty, not as an error
      console.warn(`WooCommerce category not found: ${slug}`);
      return { products: [], failed: false };
    }
    return { products: await getProductsByCategory(categoryId), failed: false };
  } catch (error) {
    console.error(`Failed to load products for ${slug}:`, error.message);
    return { products: [], failed: true };
  }
}

async function loadSections() {
  const results = await Promise.all(
    SECTIONS.map((section) => loadCategoryProducts(section.slug))
  );

  const seen = new Set();
  return SECTIONS.map((section, i) => {
    const products = results[i].products.filter((product) => {
      if (seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    });
    return { ...section, products, failed: results[i].failed };
  });
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-black text-white">
      {HAS_HERO_IMAGE ? (
        <Image
          src="/images/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover opacity-50"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-br from-black via-neutral-900 to-rose-950"
        />
      )}
      <div className="mx-auto flex min-h-[70vh] max-w-6xl flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
          আত্মবিশ্বাসী পর্দাশীল নারীর জন্য
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-neutral-200 sm:text-xl">
          আধুনিক খিমার ডিজাইন — সম্পূর্ণ আরামে ও স্টাইলে
        </p>
        <a
          href="#instant-ready-hijab"
          data-track="hero-cta"
          className="mt-8 inline-block rounded-full bg-white px-8 py-3 text-base font-semibold text-black transition hover:bg-neutral-200"
        >
          ইনস্ট্যান্ট রেডি হিজাব
        </a>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="border-b border-neutral-200 bg-neutral-50">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-5"
          >
            <span className="text-3xl" aria-hidden="true">
              {feature.icon}
            </span>
            <p className="font-semibold text-neutral-800">{feature.title}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryTabs() {
  return (
    <nav
      aria-label="ক্যাটাগরি"
      // Sticks just below the 4rem site header
      className="sticky top-[calc(env(safe-area-inset-top,0px)+4rem)] z-20 border-b border-neutral-200 bg-white/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-7xl justify-center gap-2 px-4 py-3 sm:gap-4">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:border-black hover:bg-black hover:text-white sm:px-6 sm:text-base"
          >
            {section.title}
          </a>
        ))}
      </div>
    </nav>
  );
}

function CategorySection({ section }) {
  const { id, slug, title, description, allDesignsHref, products, failed } = section;

  return (
    <section id={id} className="scroll-mt-36 even:bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-neutral-900">{title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-neutral-600">{description}</p>
          {allDesignsHref ? (
            <Link
              href={allDesignsHref}
              data-track="home-all-designs"
              className="mt-5 inline-block rounded-full bg-[#b45309] px-6 py-2.5 font-semibold text-white transition hover:bg-[#92400e]"
            >
              সব ডিজাইন দেখুন
            </Link>
          ) : null}
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-neutral-200 bg-white py-12 text-center text-neutral-500">
            {failed
              ? "এই মুহূর্তে পণ্য দেখানো যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।"
              : "শীঘ্রই আসছে।"}
          </p>
        )}

        <div className="mt-8 text-center">
          <Link
            href={`/shop?category=${slug}`}
            data-track={`home-see-all-${slug}`}
            className="inline-block rounded-full border-2 border-black px-8 py-2.5 font-semibold text-black transition hover:bg-black hover:text-white"
          >
            সব দেখুন
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function Home() {
  const sections = await loadSections();

  return (
    <main className="flex-1">
      <Hero />
      <CategoryTabs />
      <Features />
      {sections.map((section) => (
        <CategorySection key={section.id} section={section} />
      ))}
    </main>
  );
}
