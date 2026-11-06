import Link from "next/link";

// Server-rendered pager; makeHref(page) builds the link for a page number
export default function Pagination({ page, totalPages, makeHref }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p += 1) pages.push(p);

  const item = "rounded-lg border px-3 py-1.5 text-sm font-semibold";
  return (
    <nav aria-label="পেজ" className="mt-4 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={makeHref(page - 1)} className={`${item} border-neutral-300 hover:bg-neutral-50`}>আগে</Link>
      ) : null}
      {pages.map((p) => (
        <Link
          key={p}
          href={makeHref(p)}
          aria-current={p === page ? "page" : undefined}
          className={`${item} ${p === page ? "border-[#b45309] bg-[#b45309] text-white" : "border-neutral-300 hover:bg-neutral-50"}`}
        >
          {p}
        </Link>
      ))}
      {page < totalPages ? (
        <Link href={makeHref(page + 1)} className={`${item} border-neutral-300 hover:bg-neutral-50`}>পরে</Link>
      ) : null}
    </nav>
  );
}
