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
          <Link href="/" className="rounded-full bg-[var(--forest)] px-5 py-2.5 text-sm font-semibold text-white">Try overview</Link>
          <Link href="/plants" className="rounded-full bg-black/5 px-5 py-2.5 text-sm font-semibold text-black/65">Plants</Link>
        </div>
      </div>
    </section>
  );
}

export function EmptyState({ title = "Nothing connected yet", message = "No matching plant records were found for this view." }: { title?: string; message?: string }) {
  return (
    <div className="rounded-[28px] bg-black/[0.035] px-6 py-14 text-center">
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

export function LoadingPanel({ label = "Tracing plant relationships…" }: { label?: string }) {
  return (
    <div className="grid min-h-[45vh] place-items-center">
      <div className="text-center">
        <div className="mx-auto size-9 animate-spin rounded-full border-2 border-black/10 border-t-[var(--forest)]" />
        <p className="mt-4 text-sm font-medium text-black/50">{label}</p>
      </div>
    </div>
  );
}
