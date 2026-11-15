"use client";

import { useState } from "react";
import { num, taka } from "@/lib/admin/format";

// Pie of sales share per category. rows: [{ id, name, color: { fill, ink }, units, revenue, share }]
// Slices stay in category creation order (not sorted by size) so each category keeps its colour
// and neighbouring colours match the validated palette order.
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

export default function CategoryPie({ rows, totalUnits }) {
  const [active, setActive] = useState(null);
  const sold = rows.filter((r) => r.units > 0);

  const arcs = sold.reduce((list, row) => {
    const start = list.length ? list[list.length - 1].end : 0;
    const end = start + (row.units / totalUnits) * Math.PI * 2;
    return [...list, { row, start, end, mid: (start + end) / 2 }];
  }, []);
  const hovered = rows.find((r) => r.id === active);

  return (
    <div className="grid items-center gap-6 md:grid-cols-[minmax(0,300px)_1fr]">
      <div className="relative mx-auto w-full max-w-[300px]">
        {totalUnits === 0 ? (
          <div className="flex aspect-square items-center justify-center rounded-full border-2 border-dashed border-neutral-200 text-center text-sm text-neutral-500">
            এই সময়ে কোনো বিক্রি নেই
          </div>
        ) : (
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full" role="img" aria-label="ক্যাটাগরি অনুযায়ী বিক্রির পাই চার্ট">
            {arcs.map(({ row, start, end }) => {
              const dim = active && active !== row.id;
              const common = {
                fill: row.color.fill,
                stroke: "#ffffff",
                strokeWidth: 2, // surface gap between slices
                opacity: dim ? 0.35 : 1,
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
                  fontSize="15"
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
        {hovered ? (
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-2 whitespace-nowrap rounded-lg bg-neutral-900 px-3 py-2 text-xs text-white shadow-lg">
            <p className="font-semibold">{hovered.name}</p>
            <p>{pct(hovered.share)} · {num(hovered.units)}টি · {taka(hovered.revenue)}</p>
          </div>
        ) : null}
      </div>

      {/* Legend + table view: every slice named with its numbers (identity never by colour alone) */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-neutral-500">
            <th className="pb-2 font-medium">ক্যাটাগরি</th>
            <th className="pb-2 text-right font-medium">শতাংশ</th>
            <th className="pb-2 text-right font-medium">বিক্রি (পিস)</th>
            <th className="pb-2 text-right font-medium">টাকা</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((row) => (
            <tr
              key={row.id}
              onMouseEnter={() => setActive(row.id)}
              onMouseLeave={() => setActive(null)}
              className={`transition-colors ${active === row.id ? "bg-neutral-50" : ""} ${row.units === 0 ? "text-neutral-400" : ""}`}
            >
              <td className="py-2.5 pr-3">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: row.color.fill }} aria-hidden="true" />
                  <span className={row.units === 0 ? "" : "font-medium text-neutral-900"}>{row.name}</span>
                </span>
              </td>
              <td className="py-2.5 text-right font-semibold">{pct(row.share)}</td>
              <td className="py-2.5 text-right">{num(row.units)}টি</td>
              <td className="py-2.5 text-right">{taka(row.revenue)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-neutral-200 font-semibold">
            <td className="pt-2.5">মোট</td>
            <td className="pt-2.5 text-right">{totalUnits ? "100%" : "0%"}</td>
            <td className="pt-2.5 text-right">{num(totalUnits)}টি</td>
            <td className="pt-2.5 text-right">{taka(rows.reduce((sum, r) => sum + r.revenue, 0))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
