"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Tags,
  Truck,
  Users,
  X,
} from "lucide-react";
import { logout } from "@/app/admin/login/actions";

const NAV = [
  { href: "/admin", label: "ওভারভিউ", icon: LayoutDashboard },
  { href: "/admin/products", label: "পণ্য", icon: Package },
  { href: "/admin/orders", label: "অর্ডার", icon: ShoppingCart },
  { href: "/admin/customers", label: "গ্রাহক", icon: Users },
  { href: "/admin/discounts", label: "ক্যাটাগরি ও ছাড়", icon: Tags },
  { href: "/admin/delivery", label: "ডেলিভারি ও পেমেন্ট", icon: Truck },
  { href: "/admin/analytics", label: "বিশ্লেষণ", icon: BarChart3 },
  { href: "/admin/settings", label: "সেটিংস", icon: Settings },
];

// Collapsed sidebar preference, remembered in localStorage
const COLLAPSE_KEY = "admin_sidebar_collapsed";
const COLLAPSE_EVENT = "admin:sidebar";
function readCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}
function subscribeCollapsed(onChange) {
  window.addEventListener(COLLAPSE_EVENT, onChange);
  return () => window.removeEventListener(COLLAPSE_EVENT, onChange);
}
function writeCollapsed(value) {
  try {
    window.localStorage.setItem(COLLAPSE_KEY, value ? "1" : "0");
  } catch {
    // not remembered
  }
  window.dispatchEvent(new Event(COLLAPSE_EVENT));
}

function isActive(pathname, href) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({ pathname, collapsed, onNavigate }) {
  return (
    <ul className="space-y-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              title={collapsed ? label : undefined}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-[#b45309] text-white" : "text-neutral-300 hover:bg-white/10 hover:text-white"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {collapsed ? <span className="sr-only">{label}</span> : <span>{label}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function LogoutButton({ collapsed }) {
  return (
    <form action={logout}>
      <button
        type="submit"
        title={collapsed ? "লগআউট" : undefined}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-300 transition hover:bg-white/10 hover:text-white ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
        {collapsed ? <span className="sr-only">লগআউট</span> : <span>লগআউট</span>}
      </button>
    </form>
  );
}

export default function AdminShell({ children }) {
  const pathname = usePathname() ?? "/admin";
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // The login page has no sidebar
  if (pathname === "/admin/login") return children;

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col bg-neutral-900 p-3 transition-[width] duration-200 print:hidden md:flex ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div className={`mb-6 flex items-center px-2 pt-2 ${collapsed ? "justify-center" : "justify-between"}`}>
          {collapsed ? null : <span className="text-xl font-bold text-[#f59e0b]">জাবালুন অ্যাডমিন</span>}
          <button
            type="button"
            onClick={() => writeCollapsed(!collapsed)}
            aria-label={collapsed ? "সাইডবার বড় করুন" : "সাইডবার ছোট করুন"}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white"
          >
            {collapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
          </button>
        </div>
        <nav aria-label="অ্যাডমিন মেনু" className="flex-1 overflow-y-auto">
          <NavList pathname={pathname} collapsed={collapsed} />
        </nav>
        <div className="border-t border-white/10 pt-3">
          <LogoutButton collapsed={collapsed} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden print:hidden">
          <button type="button" aria-label="মেনু বন্ধ করুন" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-black/50" />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-neutral-900 p-3">
            <div className="mb-6 flex items-center justify-between px-2 pt-2">
              <span className="text-xl font-bold text-[#f59e0b]">জাবালুন অ্যাডমিন</span>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="মেনু বন্ধ করুন" className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav aria-label="অ্যাডমিন মেনু" className="flex-1">
              <NavList pathname={pathname} collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </nav>
            <div className="border-t border-white/10 pt-3">
              <LogoutButton collapsed={false} />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur print:hidden md:hidden">
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="মেনু খুলুন" className="rounded-lg p-2 text-neutral-700 hover:bg-neutral-100">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold text-[#b45309]">জাবালুন অ্যাডমিন</span>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
