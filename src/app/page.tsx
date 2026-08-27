import Link from "next/link";
import { ArrowRight, CircleAlert, HeartPulse, Trees, TrendingUp } from "lucide-react";
import { ClickableTableRow } from "@/components/clickable-table-row";
import { DatabaseErrorState, EmptyState } from "@/components/state-panels";
import { StatusPill } from "@/components/status-pill";
import { getDashboardData } from "@/lib/cognodb/service";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const result = await getDashboardData();
  if (!result.ok) return <DatabaseErrorState message={result.error.message} />;

  const { stats, recentCases, topSymptoms, treatmentInsights } = result.data;
  const healthyRate = stats.total ? Math.round((stats.healthy / stats.total) * 100) : 0;

  const metrics = [
    { label: "Trees monitored", value: stats.total, note: "Agarwood trees in 6 growing areas", icon: Trees, tone: "bg-sky-50 text-sky-700" },
    { label: "Urgent", value: stats.critical, note: "Check these trees first", icon: CircleAlert, tone: "bg-red-50 text-red-700" },
    { label: "Needs attention", value: stats.watch, note: "Follow up during the next inspection", icon: HeartPulse, tone: "bg-amber-50 text-amber-700" },
    { label: "Healthy", value: stats.healthy, note: `${healthyRate}% of monitored trees`, icon: TrendingUp, tone: "bg-emerald-50 text-emerald-700" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Agarwood plantation</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-[-0.035em] text-slate-900">Agarwood health overview</h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-6 text-slate-600">See which trees need attention, what was noticed, and where to check next.</p>
        </div>
        {stats.critical > 0 && (
          <Link href="/plants?status=critical" className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-[15px] font-semibold text-white shadow-sm transition hover:bg-red-700">
            Review {stats.critical} urgent tree{stats.critical === 1 ? "" : "s"}
            <ArrowRight className="size-4" />
          </Link>
        )}
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Tree health summary">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="info-box flex min-h-[112px] items-center gap-4 p-5">
              <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${metric.tone}`}><Icon className="size-5" /></span>
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-slate-600">{metric.label}</p>
                <p className="mt-0.5 text-3xl font-semibold tracking-[-0.035em] text-slate-900">{metric.value}</p>
                <p className="mt-1 text-[13px] leading-5 text-slate-500">{metric.note}</p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.5fr_0.5fr]">
        <div className="admin-card overflow-hidden">
          <div className="admin-card-header">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Trees needing attention</h3>
              <p className="mt-1 text-[13px] text-slate-500">Urgent and follow-up records, newest first</p>
            </div>
            <Link href="/plants" className="text-sm font-semibold text-[#2f6f78] hover:underline">View all trees</Link>
          </div>

          {recentCases.length === 0 ? (
            <div className="p-5"><EmptyState title="No trees need attention" message="All monitored agarwood trees are currently marked healthy." /></div>
          ) : (
            <>
              <div className="divide-y divide-slate-100 md:hidden">
                {recentCases.map((item) => (
                  <Link key={`${item.plantId}-${item.observedAt}`} href={`/plants/${item.plantId}`} className="block px-5 py-4 transition hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-slate-900">{item.plantCode}</p>
                        <p className="mt-1 text-[13px] text-slate-500">{item.gridName}</p>
                      </div>
                      <StatusPill status={item.status} />
                    </div>
                    <p className="mt-3 text-[14px] text-slate-700">{item.symptoms.join(", ") || "No symptom recorded"}</p>
                    <p className="mt-2 text-[13px] text-slate-500">Last checked {formatDate(item.observedAt)}</p>
                  </Link>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-left">
                  <thead className="bg-slate-50 text-[13px] text-slate-500">
                    <tr><th className="px-5 py-3 font-semibold">Tree</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Area</th><th className="px-5 py-3 font-semibold">What was noticed</th><th className="px-5 py-3 font-semibold">Last checked</th><th /></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[14px]">
                    {recentCases.map((item) => (
                      <ClickableTableRow
                        key={`${item.plantId}-${item.observedAt}`}
                        href={`/plants/${item.plantId}`}
                        label={`Open ${item.plantCode} tree record`}
                      >
                        <td className="px-5 py-4 font-semibold text-slate-900">{item.plantCode}</td>
                        <td className="px-5 py-4"><StatusPill status={item.status} /></td>
                        <td className="px-5 py-4 text-slate-700">{item.gridName}</td>
                        <td className="max-w-[280px] px-5 py-4 text-slate-600">{item.symptoms.join(", ") || "No symptom recorded"}</td>
                        <td className="px-5 py-4 text-slate-500">{formatDate(item.observedAt)}</td>
                        <td className="px-5 py-4"><ArrowRight className="size-4 text-slate-400" aria-hidden="true" /></td>
                      </ClickableTableRow>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="admin-card overflow-hidden">
          <div className="admin-card-header">
            <div><h3 className="text-base font-semibold text-slate-900">Most common symptoms</h3><p className="mt-1 text-[13px] text-slate-500">How many trees show each symptom</p></div>
          </div>
          <div className="space-y-5 p-5">
            {topSymptoms.map((symptom) => {
              const max = topSymptoms[0]?.affectedPlants || 1;
              const width = Math.max(8, Math.round((symptom.affectedPlants / max) * 100));
              return (
                <div key={symptom.name}>
                  <div className="mb-2 flex justify-between gap-3 text-[14px]"><span className="font-medium text-slate-700">{symptom.name}</span><span className="font-semibold text-slate-600">{symptom.affectedPlants}</span></div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#7ba9b1]" style={{ width: `${width}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="admin-card overflow-hidden">
        <div className="admin-card-header">
          <div><h3 className="text-base font-semibold text-slate-900">Recent treatment results</h3><p className="mt-1 text-[13px] text-slate-500">How treated trees responded</p></div>
          <Link href="/insights" className="text-sm font-semibold text-[#2f6f78] hover:underline">See all results</Link>
        </div>
        <div className="grid gap-px bg-slate-100 sm:grid-cols-2 xl:grid-cols-4">
          {treatmentInsights.slice(0, 4).map((item) => (
            <div key={item.id} className="bg-white p-5">
              <div className="flex items-start justify-between gap-3"><div><p className="text-[15px] font-semibold text-slate-800">{item.name}</p><p className="mt-1 text-[13px] text-slate-500">{item.cases} treated trees</p></div><span className="text-2xl font-semibold text-slate-900">{item.improvementRate}%</span></div>
              <p className="mt-1 text-[13px] text-slate-500">showed improvement</p>
              <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-slate-100"><span className="bg-emerald-500" style={{ flex: item.improved || .2 }} /><span className="bg-amber-400" style={{ flex: item.stable || .2 }} /><span className="bg-red-400" style={{ flex: item.declined || .2 }} /></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
