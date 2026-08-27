"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  ChevronRight,
  Github,
  Home,
  Leaf,
  Menu,
  PanelLeftClose,
  Trees,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/plants", label: "Agarwood trees", icon: Trees },
  { href: "/insights", label: "Treatment results", icon: BarChart3 },
];

function sectionLabel(pathname: string) {
  if (pathname.startsWith("/plants/")) return "Tree details";
  if (pathname.startsWith("/investigate/")) return "Related trees";
  return navItems.find((item) => item.href === "/" ? pathname === "/" : pathname.startsWith(item.href))?.label ?? "AgriTrace";
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const current = sectionLabel(pathname);

  const sidebar = (
    <aside className={cn(
      "flex h-full flex-col border-r border-slate-200 bg-white text-slate-700 transition-[width] duration-200",
      collapsed ? "lg:w-[78px]" : "lg:w-[252px]",
      "w-[280px]",
    )}>
      <div className="flex h-[70px] items-center border-b border-slate-200 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-3" onClick={() => setMobileOpen(false)}>
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7f2f4] text-[#2f6f78]">
            <Leaf className="size-5" strokeWidth={2} />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-base font-semibold tracking-[-0.02em] text-slate-900">AgriTrace</span>
              <span className="block truncate text-[13px] text-slate-500">Agarwood health</span>
            </span>
          )}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        {!collapsed && (
          <div className="mb-5 rounded-xl border border-[#dbe9ec] bg-[#f4f9fa] px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">What should I check?</p>
            <p className="mt-1 text-[13px] leading-5 text-slate-500">Start with trees marked Urgent or Needs attention.</p>
          </div>
        )}

        <nav className="space-y-1.5" aria-label="Main navigation">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group flex min-h-11 items-center rounded-lg text-[15px] font-medium transition",
                  collapsed ? "justify-center px-2" : "gap-3 px-3",
                  active
                    ? "bg-[#eaf3f5] text-[#245d65]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <Icon className="size-[18px] shrink-0" strokeWidth={1.9} />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && active && <ChevronRight className="ml-auto size-4 opacity-50" />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 p-3">
        {!collapsed ? (
          <a
            href="https://github.com/DominceAseberos/AgriTrace"
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Github className="size-[18px]" />
            Project repository
          </a>
        ) : (
          <a href="https://github.com/DominceAseberos/AgriTrace" target="_blank" rel="noreferrer" title="Project repository" className="grid h-11 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <Github className="size-[18px]" />
          </a>
        )}
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#f6f8fa] text-slate-800">
      <div className={cn("fixed inset-y-0 left-0 z-50 hidden lg:block", collapsed ? "w-[78px]" : "w-[252px]")}>{sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/35" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-[280px] shadow-2xl">{sidebar}</div>
          <button onClick={() => setMobileOpen(false)} className="absolute left-[292px] top-4 grid size-11 place-items-center rounded-full bg-white text-slate-700 shadow-lg" aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>
      )}

      <div className={cn("min-h-screen transition-[padding] duration-200", collapsed ? "lg:pl-[78px]" : "lg:pl-[252px]")}>
        <header className="sticky top-0 z-40 flex h-[70px] items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button onClick={() => setMobileOpen(true)} className="mr-3 grid size-11 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <button onClick={() => setCollapsed((value) => !value)} className="mr-4 hidden size-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 lg:grid" aria-label="Toggle sidebar">
            <PanelLeftClose className={cn("size-[18px] transition-transform", collapsed && "rotate-180")} />
          </button>

          <div className="min-w-0">
            <p className="truncate text-[13px] text-slate-500">AgriTrace</p>
            <h1 className="truncate text-base font-semibold text-slate-900">{current}</h1>
          </div>

          <div className="ml-auto hidden sm:block">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[13px] font-medium text-slate-600">
              <span className="size-2 rounded-full bg-teal-500" /> Live farm data
            </span>
          </div>
        </header>

        <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-7">{children}</main>
      </div>
    </div>
  );
}
