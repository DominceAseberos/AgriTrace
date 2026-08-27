import Link from "next/link";
import { ArrowRight, BarChart3, Network, Sprout, Stethoscope, TrendingUp } from "lucide-react";
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

  const metrics = [
    { label: "Plants observed", value: stats.total, note: "Across all connected grids", icon: Sprout, tone: "bg-[#eaf3e5] text-[#4f7a47]" },
    { label: "Healthy plants", value: stats.healthy, note: `${healthyRate}% of monitored plants`, icon: TrendingUp, tone: "bg-[#e6f4ee] text-emerald-700" },
    { label: "Needs watching", value: stats.watch, note: "Active follow-up cases", icon: Stethoscope, tone: "bg-[#fff4dc] text-amber-700" },
    { label: "Critical cases", value: stats.critical, note: "Priority investigations", icon: Network, tone: "bg-[#fdeaea] text-red-700" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">Overview / Plant health</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-slate-900">Plant health dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">Monitor field signals and trace relationships across the agricultural graph.</p>
        </div>
        {investigationTarget && (
          <Link href={`/investigate/${investigationTarget}`} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#214b32] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#183a26]">
            <Network className="size-4" /> Start investigation
          </Link>
        )}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="info-box flex items-center gap-4 p-4">
              <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${metric.tone}`}><Icon className="size-5" /></span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">{metric.label}</p>
                <p className="mt-0.5 text-2xl font-semibold tracking-[-0.035em] text-slate-900">{metric.value}</p>
                <p className="mt-0.5 truncate text-[11px] text-slate-400">{metric.note}</p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.45fr_0.55fr]">
        <div className="admin-card overflow-hidden">
          <div className="admin-card-header">
            <div><h3 className="text-sm font-semibold text-slate-800">Recent field signals</h3><p className="mt-0.5 text-xs text-slate-400">Watch and critical observations</p></div>
            <Link href="/plants" className="text-xs font-semibold text-[#4e7747] hover:underline">View all plants</Link>
          </div>
          {recentCases.length === 0 ? <div className="p-5"><EmptyState title="No active cases" message="There are no watch or critical plant observations in the graph." /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.09em] text-slate-400"><tr><th className="px-5 py-3 font-semibold">Plant</th><th className="px-5 py-3 font-semibold">Health</th><th className="px-5 py-3 font-semibold">Grid</th><th className="px-5 py-3 font-semibold">Signals</th><th className="px-5 py-3 font-semibold">Observed</th><th /></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {recentCases.map((item) => (
                    <tr key={`${item.plantId}-${item.observedAt}`} className="transition hover:bg-slate-50/80">
                      <td className="px-5 py-3.5"><Link href={`/plants/${item.plantId}`} className="font-semibold text-slate-800 hover:text-[#315b36]">{item.plantCode}</Link></td>
                      <td className="px-5 py-3.5"><StatusPill status={item.status} /></td>
                      <td className="px-5 py-3.5 text-slate-600">{item.gridName}</td>
                      <td className="max-w-[240px] truncate px-5 py-3.5 text-slate-500">{item.symptoms.join(" · ") || "No symptom tag"}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">{formatDate(item.observedAt)}</td>
                      <td className="px-5 py-3.5"><Link href={`/plants/${item.plantId}`} aria-label={`Open ${item.plantCode}`}><ArrowRight className="size-4 text-slate-300" /></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="admin-card overflow-hidden">
          <div className="admin-card-header"><div><h3 className="text-sm font-semibold text-slate-800">Symptom network</h3><p className="mt-0.5 text-xs text-slate-400">Distinct connected plants</p></div><BarChart3 className="size-4 text-slate-400" /></div>
          <div className="space-y-5 p-5">
            {topSymptoms.map((symptom) => {
              const max = topSymptoms[0]?.affectedPlants || 1;
              const width = Math.max(8, Math.round((symptom.affectedPlants / max) * 100));
              return <div key={symptom.name}><div className="mb-2 flex justify-between gap-3 text-xs"><span className="font-medium text-slate-600">{symptom.name}</span><span className="font-semibold text-slate-500">{symptom.affectedPlants}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#719866]" style={{ width: `${width}%` }} /></div></div>;
            })}
          </div>
        </div>
      </section>

      <section className="admin-card overflow-hidden">
        <div className="admin-card-header"><div><h3 className="text-sm font-semibold text-slate-800">Treatment relationship outcomes</h3><p className="mt-0.5 text-xs text-slate-400">Properties stored on RECEIVED edges</p></div><Link href="/insights" className="text-xs font-semibold text-[#4e7747] hover:underline">Open insights</Link></div>
        <div className="grid gap-px bg-slate-100 sm:grid-cols-2 xl:grid-cols-4">
          {treatmentInsights.slice(0, 4).map((item) => (
            <div key={item.id} className="bg-white p-5">
              <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-700">{item.name}</p><p className="mt-1 text-xs text-slate-400">{item.cases} treated plants</p></div><span className="text-xl font-semibold text-slate-800">{item.improvementRate}%</span></div>
              <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-slate-100"><span className="bg-emerald-600" style={{ flex: item.improved || .2 }} /><span className="bg-amber-500" style={{ flex: item.stable || .2 }} /><span className="bg-red-500" style={{ flex: item.declined || .2 }} /></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
