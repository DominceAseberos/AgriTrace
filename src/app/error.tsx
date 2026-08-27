"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("AgriTrace route error", error.digest ?? error.name);
  }, [error]);

  return (
    <section className="grid min-h-[58vh] place-items-center py-14">
      <div className="max-w-xl text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-amber-500/12 text-amber-800"><AlertTriangle className="size-6" /></span>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.045em]">This view needs another pass.</h1>
        <p className="mt-3 text-sm leading-6 text-black/55">The application caught an unexpected error without exposing database details.</p>
        <button onClick={reset} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--forest)] px-5 py-2.5 text-sm font-semibold text-white"><RotateCcw className="size-4" /> Try again</button>
      </div>
    </section>
  );
}
