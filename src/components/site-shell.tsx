"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, DatabaseZap, Leaf, Network, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Overview", icon: Activity },
  { href: "/plants", label: "Plants", icon: Sprout },
  { href: "/insights", label: "Insights", icon: Network },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <header className="sticky top-0 z-40 border-b border-black/8 bg-[color:var(--paper)]/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5 px-5 py-4 lg:px-8">
          <Link href="/" className="group flex items-center gap-3" aria-label="AgriTrace home">
            <span className="grid size-10 place-items-center rounded-full bg-[var(--forest)] text-[var(--paper)] transition-transform group-hover:-rotate-6">
              <Leaf className="size-5" strokeWidth={1.9} />
            </span>
            <span>
              <span className="block text-[15px] font-semibold tracking-[-0.02em]">AgriTrace</span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-black/45">Plant relationship intelligence</span>
            </span>
          </Link>

          <nav className="hidden items-center rounded-full bg-black/[0.035] p-1 md:flex" aria-label="Primary navigation">
            {navItems.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                    active ? "bg-white shadow-sm text-black" : "text-black/55 hover:text-black",
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.8} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 rounded-full border border-black/8 bg-white/70 px-3 py-2 text-xs font-medium text-black/55 sm:flex">
            <DatabaseZap className="size-3.5 text-[var(--moss)]" />
            CognoDB graph
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1500px] px-5 pb-16 pt-7 lg:px-8 lg:pt-10">{children}</main>

      <nav className="fixed inset-x-4 bottom-4 z-50 flex items-center justify-around rounded-2xl border border-black/10 bg-[var(--ink)] px-2 py-2 text-white shadow-2xl md:hidden" aria-label="Mobile navigation">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={cn("flex min-w-20 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px]", active ? "bg-white/12 text-white" : "text-white/55")}>
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
