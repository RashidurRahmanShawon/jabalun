"use client";

import { useState } from "react";
import { LineChart } from "./charts";
import { taka } from "@/lib/admin/format";

const LABEL = new Intl.DateTimeFormat("bn-BD-u-nu-latn", { day: "numeric", month: "short", timeZone: "Asia/Dhaka" });
const MONTH = new Intl.DateTimeFormat("bn-BD-u-nu-latn", { month: "long", timeZone: "Asia/Dhaka" });

const MODES = [
  { id: "day", label: "দিন" },
  { id: "week", label: "সপ্তাহ" },
  { id: "month", label: "মাস" },
];

// days: [{ date, revenue }] oldest first (90 days of sample data)
function group(days, mode) {
  if (mode === "day") {
    return days.slice(-30).map((d) => ({ label: LABEL.format(new Date(d.date)), value: d.revenue }));
  }
  if (mode === "week") {
    const weeks = [];
    for (let end = days.length; end > 0 && weeks.length < 12; end -= 7) {
      const chunk = days.slice(Math.max(0, end - 7), end);
      weeks.unshift({
        label: LABEL.format(new Date(chunk[0].date)),
        value: chunk.reduce((sum, d) => sum + d.revenue, 0),
      });
    }
    return weeks;
  }
  const months = new Map();
  for (const d of days) {
    const key = d.date.slice(0, 7);
    const entry = months.get(key) ?? { label: MONTH.format(new Date(d.date)), value: 0 };
    entry.value += d.revenue;
    months.set(key, entry);
  }
  return [...months.values()];
}

export default function SalesChart({ days }) {
  const [mode, setMode] = useState("day");
  const points = group(days, mode);

  return (
    <div>
      <div className="mb-4 inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-1" role="group" aria-label="সময়কাল">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={mode === m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
              mode === m.id ? "bg-white text-[#b45309] shadow-sm" : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <LineChart points={points} formatValue={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : taka(v))} />
      <p className="mt-2 text-xs text-neutral-500">
        {mode === "day" ? "দিনভিত্তিক" : mode === "week" ? "সপ্তাহভিত্তিক" : "মাসভিত্তিক"} — মোট {taka(points.reduce((s, p) => s + p.value, 0))}
      </p>
    </div>
  );
}
