import Link from "next/link";
import { SITE } from "@/lib/site";
import CartCount from "./CartCount";
import { DesktopNav, MobileMenu } from "./NavLinks";

export default function Header() {
  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-2xl font-bold text-[#b45309]">
          {SITE.siteName}
        </Link>

        <DesktopNav />

        <div className="flex items-center gap-1">
          <CartCount />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
