// Lightweight SVG charts for the admin dashboard (no chart library).
import { num, percent } from "@/lib/admin/format";

const BRAND = "#b45309";

// Responsive line chart; points: [{ label, value }]
export function LineChart({ points, formatValue = num, height = 220 }) {
  if (points.length === 0) return null;
  const width = 640;
  const pad = { top: 16, right: 12, bottom: 28, left: 48 };
  const max = Math.max(...points.map((p) => p.value), 1);
  const x = (i) => pad.left + (i / Math.max(points.length - 1, 1)) * (width - pad.left - pad.right);
  const y = (v) => pad.top + (1 - v / max) * (height - pad.top - pad.bottom);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const ticks = [0, 0.5, 1].map((t) => Math.round(max * t));
  const labelEvery = Math.ceil(points.length / 6);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="বিক্রির লাইন চার্ট">
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} stroke="#e5e5e5" />
          <text x={pad.left - 6} y={y(tick) + 4} textAnchor="end" fontSize="10" fill="#737373">
            {formatValue(tick)}
          </text>
        </g>
      ))}
      <path d={area} fill={BRAND} opacity="0.08" />
      <path d={line} fill="none" stroke={BRAND} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={p.label}>
          <circle cx={x(i)} cy={y(p.value)} r="3" fill={BRAND}>
            <title>{`${p.label}: ${formatValue(p.value)}`}</title>
          </circle>
          {i % labelEvery === 0 || i === points.length - 1 ? (
            <text x={x(i)} y={height - 8} textAnchor="middle" fontSize="10" fill="#737373">
              {p.label}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

// Horizontal bars; rows: [{ label, value }]
export function BarList({ rows, formatValue = num, color = BRAND }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="truncate text-neutral-700">{row.label}</span>
            <span className="shrink-0 font-semibold text-neutral-900">{formatValue(row.value)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-neutral-100">
            <div className="h-2.5 rounded-full" style={{ width: `${(row.value / max) * 100}%`, backgroundColor: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

// Funnel with step-to-step drop-off; steps: [{ label, value }]
export function Funnel({ steps }) {
  const first = steps[0]?.value || 1;
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => {
        const previous = steps[i - 1]?.value;
        const drop = previous ? ((previous - step.value) / previous) * 100 : null;
        return (
          <li key={step.label}>
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span className="font-medium text-neutral-800">
                {i + 1}. {step.label}
              </span>
              <span className="text-neutral-900">
                <b>{num(step.value)}</b>
                <span className="ml-2 text-xs text-neutral-500">({percent((step.value / first) * 100)})</span>
              </span>
            </div>
            <div className="h-8 rounded-lg bg-neutral-100">
              <div
                className="flex h-8 items-center rounded-lg px-2 text-xs font-semibold text-white"
                style={{ width: `${Math.max((step.value / first) * 100, 6)}%`, backgroundColor: BRAND, opacity: 1 - i * 0.15 }}
              />
            </div>
            {drop !== null ? (
              <p className="mt-1 text-xs text-red-600">↓ আগের ধাপ থেকে {percent(drop)} বাদ পড়েছে</p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

// Vertical bars; bars: [{ label, value }] with value as % (0–100)
export function ColumnChart({ bars, height = 180 }) {
  return (
    <div className="flex items-end gap-4" style={{ height }} role="img" aria-label="স্ক্রল গভীরতা চার্ট">
      {bars.map((bar) => (
        <div key={bar.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <span className="text-xs font-semibold text-neutral-800">{percent(bar.value, 0)}</span>
          <div className="w-full max-w-16 rounded-t-lg" style={{ height: `${bar.value}%`, backgroundColor: BRAND }} />
          <span className="text-xs text-neutral-500">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}
