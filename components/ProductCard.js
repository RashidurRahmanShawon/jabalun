import Image from "next/image";
import Link from "next/link";
import { decodeEntities, formatTaka } from "@/lib/text";

// `sizes` should match the grid the card is placed in (default: 2 cols mobile, 4 desktop)
export default function ProductCard({ product, sizes = "(min-width: 1024px) 25vw, 50vw" }) {
  const image = product.images?.[0];
  const name = decodeEntities(product.name);
  const href = `/product/${product.slug}`;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white">
      {/* Duplicate of the name link: skipped by keyboard and screen readers */}
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className="relative block aspect-[3/4] overflow-hidden bg-neutral-100"
      >
        {image?.src ? (
          <Image
            src={image.src}
            alt={image.alt || name}
            fill
            sizes={sizes}
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            ছবি নেই
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-neutral-900 sm:text-base">
          <Link href={href} className="underline-offset-4 hover:underline">
            {name}
          </Link>
        </h3>
        {product.price ? (
          <p className="mt-1 font-bold text-neutral-900">মূল্য: {formatTaka(product.price)}</p>
        ) : null}
        <div className="mt-auto pt-3">
          <Link
            href={href}
            className="block rounded-lg bg-black px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            অর্ডার করুন
          </Link>
        </div>
      </div>
    </div>
  );
}
