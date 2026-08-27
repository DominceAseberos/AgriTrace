import type { Metadata } from "next";
import { Activity, CheckCircle2, CircleMinus, CircleX, Network } from "lucide-react";
import { DatabaseErrorState, EmptyState } from "@/components/state-panels";
import { getTreatmentInsights } from "@/lib/cognodb/service";

export const metadata: Metadata = { title: "Insights" };
export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const result = await getTreatmentInsights();
  if (!result.ok) return <DatabaseErrorState message={result.error.message} />;

  const insights = result.data;
  const totalCases = insights.reduce((sum, item) => sum + item.cases, 0);
  const totalImproved = insights.reduce((sum, item) => sum + item.improved, 0);
  const overallRate = totalCases ? Math.round((totalImproved / totalCases) * 100) : 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">Analysis / Treatments</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-slate-900">Treatment insights</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Review outcomes stored directly on RECEIVED graph relationships.</p>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-[#214b32] px-5 py-3.5 text-white">
          <Activity className="size-5 text-[var(--lime)]" />
          <div><div className="text-3xl font-semibold tracking-[-0.05em]">{overallRate}%</div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">improved outcomes</p></div>
        </div>
      </header>

      {insights.length === 0 ? <EmptyState title="No treatment relationships yet" message="Seed or record treatment connections before exploring this view." /> : (
        <section className="grid gap-4 lg:grid-cols-2">
          {insights.map((item) => (
            <article key={item.id} className="admin-card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="eyebrow">RECEIVED → Treatment</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{item.name}</h2><p className="mt-2 text-xs text-black/42">{item.cases} connected plants</p></div>
                <div className="text-right"><div className="text-4xl font-semibold tracking-[-0.055em]">{item.improvementRate}%</div><p className="text-[10px] uppercase tracking-[0.12em] text-black/36">improvement rate</p></div>
              </div>

              <div className="mt-7 flex h-3 overflow-hidden rounded-full bg-black/5" aria-label={`${item.name} outcome distribution`}>
                <span className="bg-emerald-700" style={{ flex: item.improved || 0.001 }} />
                <span className="bg-amber-600/70" style={{ flex: item.stable || 0.001 }} />
                <span className="bg-red-700/70" style={{ flex: item.declined || 0.001 }} />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-700" /><span><strong className="block text-sm">{item.improved}</strong><span className="text-black/42">Improved</span></span></div>
                <div className="flex items-center gap-2"><CircleMinus className="size-4 text-amber-700" /><span><strong className="block text-sm">{item.stable}</strong><span className="text-black/42">Stable</span></span></div>
                <div className="flex items-center gap-2"><CircleX className="size-4 text-red-700" /><span><strong className="block text-sm">{item.declined}</strong><span className="text-black/42">Declined</span></span></div>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="admin-card grid gap-5 p-5 lg:grid-cols-[auto_1fr] lg:items-center lg:p-6">
        <span className="grid size-12 place-items-center rounded-full bg-[var(--forest)] text-white"><Network className="size-5" /></span>
        <div><p className="text-lg font-semibold tracking-[-0.025em]">Why this matters in a graph</p><p className="mt-2 max-w-4xl text-sm leading-7 text-black/52">A relational model would typically need a treatment table plus a plant-treatment join table before adding relationship-specific facts. In the graph, RECEIVED is already a first-class typed connection and can carry its own properties directly.</p></div>
      </section>
    </div>
  );
}
