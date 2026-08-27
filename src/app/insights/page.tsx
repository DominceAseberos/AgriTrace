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
    <div className="space-y-9">
      <header className="grid gap-7 border-b border-black/10 pb-9 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="eyebrow">Treatment relationship insights</p>
          <h1 className="mt-3 max-w-5xl text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">The edge carries the outcome.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-black/55">In AgriTrace, RECEIVED is not just a link. It stores when treatment happened, dosage, and observed outcome—useful evidence that belongs to the relationship itself.</p>
        </div>
        <div className="flex items-center gap-5 rounded-[24px] bg-[var(--forest)] px-6 py-5 text-white">
          <Activity className="size-5 text-[var(--lime)]" />
          <div><div className="text-3xl font-semibold tracking-[-0.05em]">{overallRate}%</div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">improved outcomes</p></div>
        </div>
      </header>

      {insights.length === 0 ? <EmptyState title="No treatment relationships yet" message="Seed or record treatment connections before exploring this view." /> : (
        <section className="grid gap-4 lg:grid-cols-2">
          {insights.map((item) => (
            <article key={item.id} className="rounded-[28px] bg-white/48 p-6 sm:p-7">
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

      <section className="grid gap-6 rounded-[30px] bg-black/[0.035] p-7 lg:grid-cols-[auto_1fr] lg:items-center lg:p-9">
        <span className="grid size-12 place-items-center rounded-full bg-[var(--forest)] text-white"><Network className="size-5" /></span>
        <div><p className="text-lg font-semibold tracking-[-0.025em]">Why this matters in a graph</p><p className="mt-2 max-w-4xl text-sm leading-7 text-black/52">A relational model would typically need a treatment table plus a plant-treatment join table before adding relationship-specific facts. In the graph, RECEIVED is already a first-class typed connection and can carry its own properties directly.</p></div>
      </section>
    </div>
  );
}
