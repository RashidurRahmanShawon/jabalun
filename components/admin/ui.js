// Shared admin building blocks. No "use client": usable from server and client pages.
// Interactive dialogs live in ./Modal.js.
import { Inbox } from "lucide-react";

export const BRAND = "#b45309";

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-neutral-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({ title, action, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm ${className}`}>
      {title ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-neutral-900">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function KpiCard({ label, value, hint, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-neutral-500">{label}</p>
        {Icon ? (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-[#b45309]">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-bold text-neutral-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
    </div>
  );
}

const TONES = {
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  green: "bg-green-50 text-green-700 ring-green-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  neutral: "bg-neutral-100 text-neutral-700 ring-neutral-200",
};

export function Badge({ tone = "neutral", children }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONES[tone] ?? TONES.neutral}`}>
      {children}
    </span>
  );
}

export function MockBadge() {
  return <Badge tone="amber">নমুনা ডেটা</Badge>;
}

export function EmptyState({ title = "কিছু পাওয়া যায়নি", description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 px-4 py-10 text-center">
      <Inbox className="h-8 w-8 text-neutral-400" aria-hidden="true" />
      <p className="mt-3 font-semibold text-neutral-700">{title}</p>
      {description ? <p className="mt-1 text-sm text-neutral-500">{description}</p> : null}
    </div>
  );
}

export function ConnectionError({ message = "WooCommerce-এর সাথে সংযোগ হয়নি।" }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {message} একটু পরে পেজটি আবার খুলুন।
    </div>
  );
}

export function Toggle({ checked, onChange, label, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? "bg-[#b45309]" : "bg-neutral-300"
      }`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

export function Button({ variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-[#b45309] text-white hover:bg-[#92400e]",
    secondary: "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-neutral-600 hover:bg-neutral-100",
  };
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}

export const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#b45309] focus:ring-1 focus:ring-[#b45309]";

export function Field({ label, htmlFor, children, hint }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-neutral-700">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
    </div>
  );
}

// Scrollable table wrapper so wide tables never stretch the page on phones
export function TableWrap({ children }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}

export const th = "border-b border-neutral-200 pb-2 pr-4 text-xs font-semibold uppercase tracking-wide text-neutral-500";
export const td = "border-b border-neutral-100 py-3 pr-4 align-middle";
