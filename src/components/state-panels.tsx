import Link from "next/link";
import { AlertTriangle, ArrowLeft, DatabaseZap, SearchX } from "lucide-react";

export function DatabaseErrorState({ title = "Plant graph unavailable", message = "We couldn't reach CognoDB right now. Check the database connection and try again." }: { title?: string; message?: string }) {
  return (
    <section className="grid min-h-[58vh] place-items-center py-14">
      <div className="max-w-xl text-center">
        <span className="mx-auto mb-6 grid size-14 place-items-center rounded-full bg-red-500/10 text-red-700">
          <DatabaseZap className="size-6" />
        </span>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/40">Connection state</p>
        <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-7 text-black/55">{message}</p>
        <div className="mt-7 flex justify-center gap-3">
          <Link href="/" className="rounded-lg bg-[#214b32] px-5 py-2.5 text-sm font-semibold text-white">Try overview</Link>
          <Link href="/plants" className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600">Plants</Link>
        </div>
      </div>
    </section>
  );
}

export function EmptyState({ title = "Nothing connected yet", message = "No matching plant records were found for this view." }: { title?: string; message?: string }) {
  return (
    <div className="admin-card px-6 py-12 text-center">
      <SearchX className="mx-auto size-6 text-black/35" />
      <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/50">{message}</p>
    </div>
  );
}

export function NotFoundState({ title = "Plant not found" }: { title?: string }) {
  return (
    <div className="mx-auto max-w-xl py-24 text-center">
      <AlertTriangle className="mx-auto size-7 text-amber-700" />
      <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">{title}</h1>
      <p className="mt-3 text-black/55">The requested plant does not exist in the current graph.</p>
      <Link href="/plants" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[var(--forest)] px-5 py-2.5 text-sm font-semibold text-white">
        <ArrowLeft className="size-4" /> Back to plants
      </Link>
    </div>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/80 ${className}`} aria-hidden="true" />;
}

export function LoadingPanel({ label = "Loading plant data…" }: { label?: string }) {
  return (
    <section className="space-y-5" aria-busy="true" aria-live="polite" aria-label={label}>
      <span className="sr-only">{label}</span>

      <div className="admin-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="mt-3 h-8 w-64 max-w-full" />
            <SkeletonBlock className="mt-3 h-4 w-full max-w-xl" />
          </div>
          <div className="grid w-full grid-cols-3 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:w-[300px]">
            {[0, 1, 2].map((item) => (
              <div key={item} className="bg-white p-4">
                <SkeletonBlock className="mx-auto h-7 w-10" />
                <SkeletonBlock className="mx-auto mt-2 h-2.5 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="admin-card flex items-center gap-4 p-4">
            <SkeletonBlock className="size-10 shrink-0" />
            <div className="flex-1">
              <SkeletonBlock className="h-6 w-10" />
              <SkeletonBlock className="mt-2 h-3 w-24" />
            </div>
          </div>
        ))}
      </div>

      <div className="admin-card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="mt-2 h-6 w-52" />
        </div>
        <div className="divide-y divide-slate-100">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="grid gap-4 px-5 py-4 sm:px-6 lg:grid-cols-[44px_0.8fr_1.3fr_auto] lg:items-center">
              <SkeletonBlock className="size-8" />
              <div>
                <SkeletonBlock className="h-4 w-20" />
                <SkeletonBlock className="mt-2 h-3 w-28" />
              </div>
              <div className="flex gap-2">
                <SkeletonBlock className="h-7 w-24" />
                <SkeletonBlock className="h-7 w-28" />
              </div>
              <SkeletonBlock className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
