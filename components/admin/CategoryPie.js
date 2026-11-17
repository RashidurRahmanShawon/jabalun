"use client";

import { useState } from "react";
import { num, taka } from "@/lib/admin/format";

// Two pies side by side: share of pieces sold and share of money, per category.
// rows: [{ id, name, color: { fill, ink }, units, revenue }]
// Slices stay in category creation order (not sorted by size) so each category keeps its colour
// in both pies. Hovering a category highlights it in both pies and both legends.
const SIZE = 260;
const R = 120;
const C = SIZE / 2;
const LABEL_MIN_SHARE = 6; // % below which the slice is too thin for a printed label

function point(angle, radius) {
  return [C + radius * Math.sin(angle), C - radius * Math.cos(angle)];
}

function slicePath(start, end) {
  const [x1, y1] = point(start, R);
  const [x2, y2] = point(end, R);
  const large = end - start > Math.PI ? 1 : 0;
  return `M${C},${C} L${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
}

const pct = (share) => `${share >= 10 || share === 0 ? Math.round(share) : share.toFixed(1)}%`;

const METRICS = {
  units: { title: "বিক্রির সংখ্যা অনুযায়ী (পিস)", column: "পিস", format: (v) => `${num(v)}টি` },
  revenue: { title: "টাকার অংক অনুযায়ী", column: "টাকা", format: (v) => taka(v) },
};

function Pie({ rows, metric, active, setActive }) {
  const { title, column, format } = METRICS[metric];
  const total = rows.reduce((sum, r) => sum + (r[metric] || 0), 0);
  const withShare = rows.map((r) => ({ ...r, value: r[metric] || 0, share: total ? ((r[metric] || 0) / total) * 100 : 0 }));
  const sold = withShare.filter((r) => r.value > 0);

  const arcs = sold.reduce((list, row) => {
    const start = list.length ? list[list.length - 1].end : 0;
    const end = start + (row.value / total) * Math.PI * 2;
    return [...list, { row, start, end, mid: (start + end) / 2 }];
  }, []);
  const hovered = withShare.find((r) => r.id === active);

  return (
    <section className="min-w-0">
      <h3 className="mb-3 text-sm font-semibold text-neutral-700">{title}</h3>
      <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,200px)_1fr]">
        <div className="relative mx-auto w-full max-w-[200px]">
          {total === 0 ? (
            <div className="flex aspect-square items-center justify-center rounded-full border-2 border-dashed border-neutral-200 p-4 text-center text-sm text-neutral-500">
              এই সময়ে কোনো বিক্রি নেই
            </div>
          ) : (
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full" role="img" aria-label={`ক্যাটাগরি অনুযায়ী পাই চার্ট — ${title}`}>
              {arcs.map(({ row, start, end }) => {
                const common = {
                  fill: row.color.fill,
                  stroke: "#ffffff",
                  strokeWidth: 2, // surface gap between slices
                  opacity: active && active !== row.id ? 0.35 : 1,
                  className: "cursor-pointer transition-opacity",
                  onMouseEnter: () => setActive(row.id),
                  onMouseLeave: () => setActive(null),
                  onClick: () => setActive((a) => (a === row.id ? null : row.id)),
                };
                return arcs.length === 1 ? (
                  <circle key={row.id} cx={C} cy={C} r={R} {...common} />
                ) : (
                  <path key={row.id} d={slicePath(start, end)} {...common} />
                );
              })}
              {arcs.map(({ row, mid }) => {
                if (row.share < LABEL_MIN_SHARE) return null;
                const [x, y] = arcs.length === 1 ? [C, C] : point(mid, R * 0.62);
                return (
                  <text
                    key={`label-${row.id}`}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="17"
                    fontWeight="700"
                    fill={row.color.ink}
                    pointerEvents="none"
                    opacity={active && active !== row.id ? 0.35 : 1}
                  >
                    {pct(row.share)}
                  </text>
                );
              })}
            </svg>
          )}
          {hovered && hovered.value > 0 ? (
            <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-2 whitespace-nowrap rounded-lg bg-neutral-900 px-3 py-2 text-xs text-white shadow-lg">
              <p className="font-semibold">{hovered.name}</p>
              <p>{pct(hovered.share)} · {format(hovered.value)}</p>
            </div>
          ) : null}
        </div>

        {/* Legend + table view: every slice named with its numbers (identity never by colour alone) */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="pb-2 font-medium">ক্যাটাগরি</th>
              <th className="pb-2 text-right font-medium">শতাংশ</th>
              <th className="pb-2 text-right font-medium">{column}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {withShare.map((row) => (
              <tr
                key={row.id}
                onMouseEnter={() => setActive(row.id)}
                onMouseLeave={() => setActive(null)}
                className={`transition-colors ${active === row.id ? "bg-neutral-50" : ""} ${row.value === 0 ? "text-neutral-400" : ""}`}
              >
                <td className="py-2 pr-2">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: row.color.fill }} aria-hidden="true" />
                    <span className={row.value === 0 ? "" : "font-medium text-neutral-900"}>{row.name}</span>
                  </span>
                </td>
                <td className="py-2 text-right font-semibold">{pct(row.share)}</td>
                <td className="whitespace-nowrap py-2 pl-2 text-right">{format(row.value)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-neutral-200 font-semibold">
              <td className="pt-2">মোট</td>
              <td className="pt-2 text-right">{total ? "100%" : "0%"}</td>
              <td className="whitespace-nowrap pt-2 pl-2 text-right">{format(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

export default function CategoryPie({ rows }) {
  const [active, setActive] = useState(null);
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-neutral-100">
      <div className="lg:pr-6">
        <Pie rows={rows} metric="units" active={active} setActive={setActive} />
      </div>
      <div className="lg:pl-6">
        <Pie rows={rows} metric="revenue" active={active} setActive={setActive} />
      </div>
    </div>
  );
}
