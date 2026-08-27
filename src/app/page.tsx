import Link from "next/link";
import { ArrowUpRight, Network, Sprout, Stethoscope, TrendingUp } from "lucide-react";
import { DatabaseErrorState, EmptyState } from "@/components/state-panels";
import { StatusPill } from "@/components/status-pill";
import { getDashboardData } from "@/lib/cognodb/service";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const result = await getDashboardData();
  if (!result.ok) return <DatabaseErrorState message={result.error.message} />;

  const { stats, recentCases, topSymptoms, treatmentInsights } = result.data;
  const investigationTarget = recentCases[0]?.plantId;
  const healthyRate = stats.total ? Math.round((stats.healthy / stats.total) * 100) : 0;

  return (
    <div className="space-y-10 lg:space-y-14">
      <section className="grid gap-10 border-b border-black/10 pb-10 lg:grid-cols-[1.4fr_0.6fr] lg:items-end lg:pb-14">
        <div className="reveal">
          <p className="eyebrow mb-5">Graph-based plant health investigation</p>
          <h1 className="display max-w-5xl">Find the <span className="text-[var(--moss)]">connection</span> before it becomes a pattern.</h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-black/55 sm:text-lg">
            AgriTrace follows symptoms, treatments, proximity, workers and grids as connected evidence—so a supervisor can see why two plant cases may be related.
          </p>
        </div>

        <div className="lg:pb-2">
          <p className="eyebrow">Start an investigation</p>
          <p className="mt-3 text-sm leading-6 text-black/55">Open a recent affected plant and trace its multi-hop relationships across the farm graph.</p>
          {investigationTarget ? (
            <Link href={`/investigate/${investigationTarget}`} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">
              Trace related cases <ArrowUpRight className="size-4" />
            </Link>
          ) : (
            <Link href="/plants" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white">Browse plants <ArrowUpRight className="size-4" /></Link>
          )}
        </div>
      </section>

      <section className="metric-rule grid overflow-hidden rounded-[30px] bg-white/48 md:grid-cols-4">
        {[
          { label: "Plants observed", value: stats.total, note: "Across connected grids", icon: Sprout },
          { label: "Healthy", value: stats.healthy, note: `${healthyRate}% of monitored plants`, icon: TrendingUp },
          { label: "Needs watching", value: stats.watch, note: "Active follow-up cases", icon: Stethoscope },
          { label: "Critical", value: stats.critical, note: "Prioritize investigation", icon: Network },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="px-6 py-7 lg:px-8 lg:py-9">
              <div className="flex items-center justify-between text-black/40"><span className="eyebrow !tracking-[0.12em]">{metric.label}</span><Icon className="size-4" strokeWidth={1.6} /></div>
              <div className="mt-5 text-5xl font-semibold tracking-[-0.06em]">{metric.value}</div>
              <p className="mt-2 text-xs text-black/45">{metric.note}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.35fr_0.65fr]">
        <div>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Recent field signals</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Cases worth tracing</h2>
            </div>
            <Link href="/plants" className="text-sm font-semibold text-[var(--forest)]">View all plants</Link>
          </div>

          {recentCases.length === 0 ? <EmptyState title="No active cases" message="There are no watch or critical plant observations in the graph." /> : (
            <div className="divide-y divide-black/8 rounded-[28px] bg-white/45 px-5 sm:px-7">
              {recentCases.map((item) => (
                <Link key={`${item.plantId}-${item.observedAt}`} href={`/plants/${item.plantId}`} className="group grid gap-3 py-5 transition sm:grid-cols-[0.72fr_1fr_1.5fr_auto] sm:items-center">
                  <div>
                    <div className="text-base font-semibold tracking-[-0.02em]">{item.plantCode}</div>
                    <div className="mt-1 text-xs text-black/45">{item.gridName}</div>
                  </div>
                  <div><StatusPill status={item.status} /></div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-black/70">{item.symptoms.join(" · ") || "No symptom tag"}</p>
                    <p className="mt-1 text-xs text-black/40">{formatDate(item.observedAt)}</p>
                  </div>
                  <ArrowUpRight className="hidden size-4 text-black/30 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-black sm:block" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[30px] bg-[var(--forest)] p-7 text-[var(--paper)] sm:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Symptom network</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">What is clustering?</h2>
          <p className="mt-3 text-sm leading-6 text-white/55">Distinct plants connected to each symptom through observation nodes.</p>
          <div className="mt-8 space-y-5">
            {topSymptoms.map((symptom, index) => {
              const max = topSymptoms[0]?.affectedPlants || 1;
              const width = Math.max(12, Math.round((symptom.affectedPlants / max) * 100));
              return (
                <div key={symptom.name}>
                  <div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium">{symptom.name}</span><span className="text-white/50">{symptom.affectedPlants}</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[var(--lime)]" style={{ width: `${width}%`, opacity: 1 - index * 0.08 }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-8 border-t border-black/10 pt-9 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="eyebrow">Relationship properties</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">Treatment outcomes live on the edges.</h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-black/55">The RECEIVED relationship stores when a treatment was applied, dosage and outcome. That means the connection itself carries evidence—not just the plant and treatment nodes.</p>
          <Link href="/insights" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--forest)]">Explore treatment insights <ArrowUpRight className="size-4" /></Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {treatmentInsights.slice(0, 4).map((item) => (
            <div key={item.id} className="soft-panel rounded-[24px] p-5">
              <div className="flex items-start justify-between gap-3"><h3 className="font-semibold tracking-[-0.02em]">{item.name}</h3><span className="text-2xl font-semibold tracking-[-0.05em]">{item.improvementRate}%</span></div>
              <p className="mt-1 text-xs text-black/45">improved outcomes · {item.cases} treated plants</p>
              <div className="mt-5 flex gap-1.5">
                <span className="h-1.5 rounded-full bg-emerald-700" style={{ flex: item.improved || 0.25 }} />
                <span className="h-1.5 rounded-full bg-amber-600/60" style={{ flex: item.stable || 0.25 }} />
                <span className="h-1.5 rounded-full bg-red-700/60" style={{ flex: item.declined || 0.25 }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
