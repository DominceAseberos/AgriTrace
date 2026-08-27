import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
  GitBranch,
  MapPin,
  Network,
  Sprout,
  Stethoscope,
  UsersRound,
} from "lucide-react";
import { InvestigationGraph } from "@/components/investigation-graph";
import { DatabaseErrorState, EmptyState, NotFoundState } from "@/components/state-panels";
import { StatusPill } from "@/components/status-pill";
import { getInvestigation } from "@/lib/cognodb/service";
import { formatDate } from "@/lib/utils";
import type { ConnectionReasonType } from "@/lib/cognodb/types";

export const dynamic = "force-dynamic";

const reasonIcon: Record<ConnectionReasonType, typeof Network> = {
  symptom: Stethoscope,
  near: MapPin,
  treatment: Sprout,
  "worker-trace": UsersRound,
};

const reasonLabel: Record<ConnectionReasonType, string> = {
  symptom: "Shared symptom",
  near: "Nearby plant",
  treatment: "Shared treatment",
  "worker-trace": "Worker trace",
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Investigation ${id}` };
}

export default async function InvestigationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getInvestigation(id);
  if (!result.ok) {
    if (result.error.code === "NOT_FOUND") return <NotFoundState title="Investigation source not found" />;
    return <DatabaseErrorState message={result.error.message} />;
  }

  const { source, relatedCases, workerTraces, graph } = result.data;
  const highConfidence = relatedCases.filter((item) => item.strength === "high").length;
  const topCases = relatedCases.slice(0, 5);

  const evidenceCounts = relatedCases.reduce<Record<ConnectionReasonType, number>>(
    (counts, item) => {
      const seen = new Set<ConnectionReasonType>();
      for (const reason of item.reasons) {
        if (!seen.has(reason.type)) {
          counts[reason.type] += 1;
          seen.add(reason.type);
        }
      }
      return counts;
    },
    { symptom: 0, near: 0, treatment: 0, "worker-trace": 0 },
  );

  const strongestEvidence = (Object.entries(evidenceCounts) as [ConnectionReasonType, number][])
    .sort((a, b) => b[1] - a[1])[0];

  const strongestLabel = strongestEvidence?.[1] > 0 ? reasonLabel[strongestEvidence[0]].toLowerCase() : "relationship evidence";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href={`/plants/${source.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900">
          <ArrowLeft className="size-4" /> Back to {source.code}
        </Link>
        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
          <GitBranch className="size-3.5" /> Graph investigation
        </div>
      </div>

      <header className="admin-card overflow-hidden">
        <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[1fr_auto] xl:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-900">{source.code}</h1>
              <StatusPill status={source.status} />
              <span className="text-xs text-slate-400">{source.gridName} · {source.companyName}</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{source.species}</p>
          </div>
          <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-200 text-center">
            <div className="bg-white px-5 py-3"><div className="text-2xl font-semibold text-slate-900">{relatedCases.length}</div><p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400">Related</p></div>
            <div className="bg-white px-5 py-3"><div className="text-2xl font-semibold text-slate-900">{highConfidence}</div><p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400">High match</p></div>
            <div className="bg-white px-5 py-3"><div className="text-2xl font-semibold text-slate-900">{workerTraces.length}</div><p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400">Cross-grid</p></div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-emerald-50/60 px-5 py-4 sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-800/60">Investigation summary</p>
          <p className="mt-1 max-w-5xl text-sm font-medium leading-6 text-emerald-950">
            {source.code} is connected to <strong>{relatedCases.length} other plants</strong>. The most common signal is <strong>{strongestLabel}</strong>
            {strongestEvidence?.[1] ? `, appearing in ${strongestEvidence[1]} related cases` : ""}.
            {workerTraces.length > 0 ? ` ${workerTraces.length} cross-grid worker path${workerTraces.length === 1 ? " was" : "s were"} also found.` : ""}
          </p>
        </div>
      </header>

      {relatedCases.length === 0 ? (
        <EmptyState title="No related cases found" message="This plant currently has no shared symptom, treatment, proximity or worker-trace relationships to other recorded cases." />
      ) : (
        <>
          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="eyebrow">At a glance</p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.025em] text-slate-900">What connected this plant?</h2>
              </div>
              <span className="text-xs text-slate-400">Counts show related plants, not raw edges</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {(Object.entries(evidenceCounts) as [ConnectionReasonType, number][]).map(([type, count]) => {
                const Icon = reasonIcon[type];
                return (
                  <div key={type} className="admin-card flex items-center gap-4 p-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-800"><Icon className="size-4.5" /></span>
                    <div className="min-w-0"><p className="text-2xl font-semibold tracking-[-0.04em] text-slate-900">{count}</p><p className="text-xs font-medium text-slate-500">{reasonLabel[type]}</p></div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="admin-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <p className="eyebrow">Priority matches</p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.025em] text-slate-900">Plants to check first</h2>
              </div>
              <p className="text-xs text-slate-400">Ranked by combined graph evidence</p>
            </div>

            <div className="divide-y divide-slate-100">
              {topCases.map((item, index) => (
                <div key={item.plant.id} className="grid gap-4 px-5 py-4 sm:px-6 lg:grid-cols-[44px_0.8fr_1.3fr_auto] lg:items-center">
                  <span className="grid size-8 place-items-center rounded-md bg-slate-100 text-xs font-semibold text-slate-500">{String(index + 1).padStart(2, "0")}</span>

                  <div>
                    <div className="flex items-center gap-2"><Link href={`/plants/${item.plant.id}`} className="font-semibold text-slate-900 hover:underline">{item.plant.code}</Link><span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-800">{item.strength}</span></div>
                    <p className="mt-1 text-xs text-slate-400">{item.plant.gridName} · score {item.score}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {item.reasons.map((reason) => {
                      const Icon = reasonIcon[reason.type];
                      return (
                        <span key={`${reason.type}-${reason.label}`} title={reason.detail} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                          <Icon className="size-3.5 text-emerald-700" /> {reason.type === "symptom" || reason.type === "treatment" ? reason.label : reasonLabel[reason.type]}
                        </span>
                      );
                    })}
                  </div>

                  <Link href={`/plants/${item.plant.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">Open record <ArrowUpRight className="size-3.5" /></Link>
                </div>
              ))}
            </div>
          </section>

          <details className="admin-card group overflow-hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><Network className="size-4" /></span>
                <div><p className="text-sm font-semibold text-slate-900">Explore relationship graph</p><p className="mt-0.5 text-xs text-slate-400">Open only when you want to inspect the actual paths</p></div>
              </div>
              <ChevronDown className="size-4 text-slate-400 transition group-open:rotate-180" />
            </summary>
            <div className="border-t border-slate-200 p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-medium text-slate-500">Selected plant → evidence → top related plants</p><span className="text-[10px] uppercase tracking-[0.1em] text-slate-400">Drag · zoom · inspect</span></div>
              <InvestigationGraph graph={graph} />
            </div>
          </details>

          <section className="admin-card overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
              <p className="eyebrow">Cross-grid worker trace</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.025em] text-slate-900">Who recorded the same signal elsewhere?</h2>
              <p className="mt-1 text-xs leading-5 text-slate-400">This is the relationally awkward query: the same worker recorded the same symptom on another plant in a different grid.</p>
            </div>

            {workerTraces.length === 0 ? (
              <div className="px-5 py-8 text-sm text-slate-400 sm:px-6">No cross-grid worker trace was found for this plant.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {workerTraces.slice(0, 6).map((trace, index) => (
                  <div key={`${trace.targetPlantId}-${trace.workerName}-${index}`} className="grid gap-3 px-5 py-4 sm:px-6 lg:grid-cols-[1fr_1.2fr_auto] lg:items-center">
                    <div><p className="text-sm font-semibold text-slate-900">{trace.workerName}</p><p className="mt-1 text-xs text-slate-400">same recorder</p></div>
                    <div><p className="text-sm font-medium text-slate-700">{trace.symptomName}</p><p className="mt-1 text-xs text-slate-400">{trace.sourceGrid} → {trace.targetGrid}</p></div>
                    <div className="lg:text-right"><Link href={`/plants/${trace.targetPlantId}`} className="text-sm font-semibold text-emerald-800">{trace.targetPlantCode}</Link><p className="mt-1 text-xs text-slate-400">{formatDate(trace.observedAt)}</p></div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
