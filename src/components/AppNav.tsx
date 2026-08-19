"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { Logo } from "@/components/Logo";

const links = [
  { href: "/", label: "Books" },
  { href: "/cash-jobs", label: "Cash jobs" },
  { href: "/invoice/new", label: "New invoice" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="no-print sticky top-0 z-20 border-b border-stone-300/60 bg-[#e8ebe4]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Logo className="h-9 w-auto object-contain sm:h-10" />
          <p className="hidden text-xs text-stone-500 sm:block">Radiant Rooms Co</p>
        </div>

        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : link.href.startsWith("/invoice")
                  ? pathname.startsWith("/invoice")
                  : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-[#5f7a64] text-white"
                    : "text-stone-700 hover:bg-white/70"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md px-3 py-2 text-sm font-medium text-stone-500 hover:bg-white/70 hover:text-stone-800"
            >
              Log out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
