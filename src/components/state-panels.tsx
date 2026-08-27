import Link from "next/link";
import { AlertTriangle, ArrowLeft, CloudOff, SearchX } from "lucide-react";

export function DatabaseErrorState({ title = "Farm data is temporarily unavailable", message = "We couldn't load the latest agarwood records right now. Please try again in a moment." }: { title?: string; message?: string }) {
  return (
    <section className="grid min-h-[55vh] place-items-center py-12">
      <div className="max-w-xl text-center">
        <span className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-slate-100 text-slate-600"><CloudOff className="size-6" /></span>
        <h1 className="text-3xl font-semibold tracking-[-0.035em] text-slate-900">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-6 text-slate-600">{message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex min-h-11 items-center rounded-lg bg-[#2f6f78] px-5 text-[15px] font-semibold text-white">Try again from overview</Link>
          <Link href="/plants" className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-5 text-[15px] font-semibold text-slate-700">View tree list</Link>
        </div>
      </div>
    </section>
  );
}

export function EmptyState({ title = "No records found", message = "There are no matching agarwood tree records for this view." }: { title?: string; message?: string }) {
  return (
    <div className="admin-card px-6 py-12 text-center">
      <SearchX className="mx-auto size-7 text-slate-400" />
      <h2 className="mt-4 text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-[15px] leading-6 text-slate-600">{message}</p>
    </div>
  );
}

export function NotFoundState({ title = "Tree not found" }: { title?: string }) {
  return (
    <div className="mx-auto max-w-xl py-20 text-center">
      <AlertTriangle className="mx-auto size-7 text-amber-600" />
      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-slate-900">{title}</h1>
      <p className="mt-3 text-[15px] text-slate-600">This agarwood tree is not in the current records.</p>
      <Link href="/plants" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#2f6f78] px-5 text-[15px] font-semibold text-white"><ArrowLeft className="size-4" /> Back to all trees</Link>
    </div>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/80 ${className}`} aria-hidden="true" />;
}

export function LoadingPanel({ label = "Loading agarwood records…" }: { label?: string }) {
  return (
    <section className="space-y-5" aria-busy="true" aria-live="polite" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1"><SkeletonBlock className="h-4 w-36" /><SkeletonBlock className="mt-3 h-8 w-72 max-w-full" /><SkeletonBlock className="mt-3 h-4 w-full max-w-xl" /></div>
        <SkeletonBlock className="h-11 w-44" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0,1,2,3].map((item) => <div key={item} className="admin-card flex min-h-[112px] items-center gap-4 p-5"><SkeletonBlock className="size-12 shrink-0" /><div className="flex-1"><SkeletonBlock className="h-4 w-24" /><SkeletonBlock className="mt-2 h-8 w-12" /><SkeletonBlock className="mt-2 h-3 w-32" /></div></div>)}
      </div>
      <div className="admin-card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4"><SkeletonBlock className="h-5 w-44" /><SkeletonBlock className="mt-2 h-3 w-56" /></div>
        <div className="divide-y divide-slate-100">
          {[0,1,2,3].map((item) => <div key={item} className="grid gap-4 px-5 py-4 md:grid-cols-[0.8fr_1fr_1.3fr_0.8fr] md:items-center"><SkeletonBlock className="h-5 w-20" /><SkeletonBlock className="h-7 w-28" /><SkeletonBlock className="h-4 w-full max-w-52" /><SkeletonBlock className="h-4 w-24" /></div>)}
        </div>
      </div>
    </section>
  );
}
