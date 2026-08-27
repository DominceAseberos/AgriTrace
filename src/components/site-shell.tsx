"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  BarChart3,
  ChevronRight,
  DatabaseZap,
  Github,
  Leaf,
  Menu,
  PanelLeftClose,
  Sprout,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: Activity, section: "Monitor" },
  { href: "/plants", label: "Plant records", icon: Sprout, section: "Monitor" },
  { href: "/insights", label: "Treatment insights", icon: BarChart3, section: "Analysis" },
];

function sectionLabel(pathname: string) {
  if (pathname.startsWith("/plants/")) return "Plant record";
  if (pathname.startsWith("/investigate/")) return "Graph investigation";
  return navItems.find((item) => item.href === "/" ? pathname === "/" : pathname.startsWith(item.href))?.label ?? "AgriTrace";
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const current = sectionLabel(pathname);

  const sidebar = (
    <aside className={cn(
      "flex h-full flex-col bg-[#17251d] text-white transition-[width] duration-200",
      collapsed ? "lg:w-[82px]" : "lg:w-[258px]",
      "w-[258px]",
    )}>
      <div className="flex h-16 items-center border-b border-white/8 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-3" onClick={() => setMobileOpen(false)}>
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#8fb56e] text-[#17251d] shadow-[0_8px_24px_rgba(143,181,110,.18)]">
            <Leaf className="size-5" strokeWidth={2} />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-semibold tracking-[-0.02em]">AgriTrace</span>
              <span className="block truncate text-[10px] font-medium uppercase tracking-[0.14em] text-white/38">Plant intelligence</span>
            </span>
          )}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        {!collapsed && (
          <div className="mb-5 rounded-xl bg-white/[0.055] px-3 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-white/70">
              <DatabaseZap className="size-4 text-[#9bc17a]" />
              CognoDB graph layer
            </div>
            <p className="mt-1.5 text-[11px] leading-4 text-white/35">OpenCypher · Bolt · live graph queries</p>
          </div>
        )}

        {["Monitor", "Analysis"].map((section) => (
          <div key={section} className="mb-5">
            {!collapsed && <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/28">{section}</p>}
            <nav className="space-y-1" aria-label={`${section} navigation`}>
              {navItems.filter((item) => item.section === section).map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "group flex items-center rounded-lg text-sm font-medium transition",
                      collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
                      active ? "bg-[#8fb56e] text-[#15211a] shadow-sm" : "text-white/58 hover:bg-white/[0.055] hover:text-white",
                    )}
                  >
                    <Icon className="size-[17px] shrink-0" strokeWidth={1.9} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && active && <ChevronRight className="ml-auto size-3.5 opacity-60" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="border-t border-white/8 p-3">
        {!collapsed ? (
          <a
            href="https://github.com/DominceAseberos/AgriTrace"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-white/48 transition hover:bg-white/[0.055] hover:text-white"
          >
            <Github className="size-4" />
            View repository
          </a>
        ) : (
          <a href="https://github.com/DominceAseberos/AgriTrace" target="_blank" rel="noreferrer" title="View repository" className="grid h-10 place-items-center rounded-lg text-white/45 hover:bg-white/[0.055] hover:text-white">
            <Github className="size-4" />
          </a>
        )}
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#1f2933]">
      <div className={cn("fixed inset-y-0 left-0 z-50 hidden lg:block", collapsed ? "w-[82px]" : "w-[258px]")}>{sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-[258px] shadow-2xl">{sidebar}</div>
          <button onClick={() => setMobileOpen(false)} className="absolute left-[270px] top-3 grid size-10 place-items-center rounded-full bg-white text-black shadow-lg" aria-label="Close navigation">
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className={cn("min-h-screen transition-[padding] duration-200", collapsed ? "lg:pl-[82px]" : "lg:pl-[258px]")}> 
        <header className="sticky top-0 z-40 flex h-16 items-center border-b border-[#dfe4e7] bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:px-7">
          <button onClick={() => setMobileOpen(true)} className="mr-3 grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Open navigation">
            <Menu className="size-5" />
          </button>
          <button onClick={() => setCollapsed((value) => !value)} className="mr-4 hidden size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 lg:grid" aria-label="Toggle sidebar">
            <PanelLeftClose className={cn("size-[18px] transition-transform", collapsed && "rotate-180")} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
              <span>AgriTrace</span><ChevronRight className="size-3" /><span className="truncate text-slate-500">{current}</span>
            </div>
            <h1 className="truncate text-sm font-semibold text-slate-800">{current}</h1>
          </div>

          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <span className="inline-flex items-center gap-2 rounded-lg border border-[#dce5dc] bg-[#f4f8f2] px-3 py-2 text-[11px] font-semibold text-[#41613e]">
              <span className="size-1.5 rounded-full bg-[#75a663]" /> CognoDB-backed
            </span>
          </div>
        </header>

        <main className="w-full px-4 py-5 sm:px-6 lg:px-7 lg:py-6">{children}</main>
      </div>
    </div>
  );
}
