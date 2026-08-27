import type { Metadata } from "next";
import { CheckCircle2, CircleMinus, CircleX, Info } from "lucide-react";
import { DatabaseErrorState, EmptyState } from "@/components/state-panels";
import { getTreatmentInsights } from "@/lib/cognodb/service";

export const metadata: Metadata = { title: "Treatment Results" };
export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const result = await getTreatmentInsights();
  if (!result.ok) return <DatabaseErrorState message={result.error.message} />;

  const insights = result.data;
  const totalCases = insights.reduce((sum, item) => sum + item.cases, 0);
  const totalImproved = insights.reduce((sum, item) => sum + item.improved, 0);
  const overallRate = totalCases ? Math.round((totalImproved / totalCases) * 100) : 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Agarwood plantation</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em] text-slate-900">Treatment results</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-6 text-slate-600">See how treated agarwood trees responded after each intervention.</p>
        </div>
        <div className="rounded-xl border border-[#d7e8eb] bg-[#eef7f8] px-5 py-4">
          <p className="text-[13px] font-medium text-slate-600">Overall improvement</p>
          <p className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-[#245d65]">{overallRate}%</p>
          <p className="mt-1 text-[13px] text-slate-500">of recorded treatment cases improved</p>
        </div>
      </header>

      {insights.length === 0 ? (
        <EmptyState title="No treatment results yet" message="Treatment results will appear here after treated trees have follow-up observations." />
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {insights.map((item) => (
            <article key={item.id} className="admin-card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><h2 className="text-xl font-semibold text-slate-900">{item.name}</h2><p className="mt-1 text-[14px] text-slate-500">Used on {item.cases} tree{item.cases === 1 ? "" : "s"}</p></div>
                <div className="text-right"><p className="text-3xl font-semibold tracking-[-0.04em] text-slate-900">{item.improvementRate}%</p><p className="text-[13px] text-slate-500">improved</p></div>
              </div>

              <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-slate-100" aria-label={`${item.name} treatment results`}>
                <span className="bg-emerald-500" style={{ flex: item.improved || 0.001 }} />
                <span className="bg-amber-400" style={{ flex: item.stable || 0.001 }} />
                <span className="bg-red-400" style={{ flex: item.declined || 0.001 }} />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-[14px]">
                <div className="rounded-lg bg-emerald-50 p-3"><CheckCircle2 className="size-4 text-emerald-700" /><strong className="mt-2 block text-lg text-slate-900">{item.improved}</strong><span className="text-[13px] text-slate-600">Improved</span></div>
                <div className="rounded-lg bg-amber-50 p-3"><CircleMinus className="size-4 text-amber-700" /><strong className="mt-2 block text-lg text-slate-900">{item.stable}</strong><span className="text-[13px] text-slate-600">No clear change</span></div>
                <div className="rounded-lg bg-red-50 p-3"><CircleX className="size-4 text-red-700" /><strong className="mt-2 block text-lg text-slate-900">{item.declined}</strong><span className="text-[13px] text-slate-600">Got worse</span></div>
              </div>
            </article>
          ))}
        </section>
      )}

      <details className="admin-card group overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-500"><Info className="size-4" /></span><div><p className="text-[15px] font-semibold text-slate-900">Technical note for reviewers</p><p className="mt-0.5 text-[13px] text-slate-500">How treatment results are represented in the graph database</p></div></div>
          <span className="text-[13px] text-slate-500 group-open:hidden">Show</span><span className="hidden text-[13px] text-slate-500 group-open:inline">Hide</span>
        </summary>
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-[14px] leading-6 text-slate-600 sm:px-6">Each treatment is connected to a tree through a typed relationship that stores the application date, dose, and outcome. This keeps those facts attached to the treatment event rather than presenting database terminology to everyday users.</div>
      </details>
    </div>
  );
}
