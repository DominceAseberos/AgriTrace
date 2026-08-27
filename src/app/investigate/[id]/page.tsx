import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Info,
  MapPin,
  Network,
  Stethoscope,
  Syringe,
  UserRoundCheck,
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
  treatment: Syringe,
  "worker-trace": UserRoundCheck,
};

const reasonLabel: Record<ConnectionReasonType, string> = {
  symptom: "Same symptom",
  near: "Nearby tree",
  treatment: "Same treatment",
  "worker-trace": "Same field worker",
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Related Trees ${id}` };
}

export default async function InvestigationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getInvestigation(id);
  if (!result.ok) {
    if (result.error.code === "NOT_FOUND") return <NotFoundState title="Tree not found" />;
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

  const strongestEvidence = (Object.entries(evidenceCounts) as [ConnectionReasonType, number][]).sort((a, b) => b[1] - a[1])[0];
  const strongestLabel = strongestEvidence?.[1] > 0 ? reasonLabel[strongestEvidence[0]].toLowerCase() : "similar recorded evidence";

  return (
    <div className="space-y-6">
      <Link href={`/plants/${source.id}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"><ArrowLeft className="size-4" /> Back to {source.code}</Link>

      <header className="admin-card overflow-hidden">
        <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[1fr_auto] xl:items-center">
          <div>
            <p className="text-sm font-medium text-slate-500">Related tree check</p>
            <div className="mt-1 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-900">{source.code}</h1><StatusPill status={source.status} /></div>
            <p className="mt-2 text-[15px] text-slate-600">{source.species} · {source.gridName}</p>
          </div>
          <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-200 text-center">
            <div className="bg-white px-5 py-3"><div className="text-2xl font-semibold text-slate-900">{relatedCases.length}</div><p className="mt-1 text-[13px] font-medium text-slate-500">Related trees</p></div>
            <div className="bg-white px-5 py-3"><div className="text-2xl font-semibold text-slate-900">{highConfidence}</div><p className="mt-1 text-[13px] font-medium text-slate-500">Strong matches</p></div>
            <div className="bg-white px-5 py-3"><div className="text-2xl font-semibold text-slate-900">{workerTraces.length}</div><p className="mt-1 text-[13px] font-medium text-slate-500">Other areas</p></div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-[#eef7f8] px-5 py-4 sm:px-6">
          <p className="text-[13px] font-semibold text-[#2f6f78]">What this means</p>
          <p className="mt-1 max-w-5xl text-[15px] leading-6 text-slate-700">
            {source.code} has <strong>{relatedCases.length} other tree{relatedCases.length === 1 ? "" : "s"}</strong> with similar recorded evidence. The most common reason is <strong>{strongestLabel}</strong>{strongestEvidence?.[1] ? `, found in ${strongestEvidence[1]} related tree${strongestEvidence[1] === 1 ? "" : "s"}` : ""}.
          </p>
        </div>
      </header>

      {relatedCases.length === 0 ? (
        <EmptyState title="No related trees found" message="There are no other recorded agarwood trees with the same symptoms, nearby location, treatment history, or field-worker pattern." />
      ) : (
        <>
          <details className="admin-card group overflow-hidden">
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-lg bg-slate-100 text-slate-600"><Network className="size-4" /></span><div><p className="text-[15px] font-semibold text-slate-900">Show connection map</p><p className="mt-0.5 text-[13px] text-slate-500">Optional visual view of the top related trees</p></div></div>
              <ChevronDown className="size-5 text-slate-400 transition group-open:rotate-180" />
            </summary>
            <div className="border-t border-slate-200 p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-[14px] font-medium text-slate-600">Selected tree → reason → related tree</p><span className="text-[13px] text-slate-500">Drag or zoom if needed</span></div>
              <InvestigationGraph graph={graph} />
            </div>
          </details>

          <section>
            <div className="mb-3"><h2 className="text-xl font-semibold text-slate-900">Why are these trees related?</h2><p className="mt-1 text-[14px] text-slate-500">Each number shows how many related trees share that kind of evidence.</p></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {(Object.entries(evidenceCounts) as [ConnectionReasonType, number][]).map(([type, count]) => {
                const Icon = reasonIcon[type];
                return (
                  <div key={type} className="admin-card flex items-center gap-4 p-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eef7f8] text-[#2f6f78]"><Icon className="size-5" /></span>
                    <div><p className="text-2xl font-semibold text-slate-900">{count}</p><p className="text-[14px] font-medium text-slate-600">{reasonLabel[type]}</p></div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="admin-card overflow-hidden">
            <div className="admin-card-header">
              <div><h2 className="text-base font-semibold text-slate-900">Trees to check first</h2><p className="mt-1 text-[13px] text-slate-500">The strongest matches are listed first.</p></div>
            </div>
            <div className="divide-y divide-slate-100">
              {topCases.map((item, index) => (
                <div key={item.plant.id} className="grid gap-4 px-5 py-4 sm:px-6 lg:grid-cols-[42px_0.8fr_1.3fr_auto] lg:items-center">
                  <span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-[13px] font-semibold text-slate-600">{index + 1}</span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><Link href={`/plants/${item.plant.id}`} className="text-[15px] font-semibold text-slate-900 hover:underline">{item.plant.code}</Link><span className="text-[13px] font-semibold text-[#2f6f78]">{item.strength === "high" ? "Strong match" : item.strength === "moderate" ? "Possible match" : "Weak match"}</span></div>
                    <p className="mt-1 text-[13px] text-slate-500">{item.plant.species} · {item.plant.gridName}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.reasons.map((reason) => {
                      const Icon = reasonIcon[reason.type];
                      const label = reason.type === "symptom" || reason.type === "treatment" ? reason.label : reasonLabel[reason.type];
                      return <span key={`${reason.type}-${reason.label}`} title={reason.detail} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[13px] font-medium text-slate-700"><Icon className="size-3.5 text-[#2f6f78]" /> {label}</span>;
                    })}
                  </div>
                  <Link href={`/plants/${item.plant.id}`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[#2f6f78]">Open tree <ArrowRight className="size-4" /></Link>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-card overflow-hidden">
            <div className="admin-card-header"><div><h2 className="text-base font-semibold text-slate-900">Same symptom seen in another area</h2><p className="mt-1 text-[13px] text-slate-500">Cases where the same field worker recorded the same symptom elsewhere.</p></div></div>
            {workerTraces.length === 0 ? (
              <div className="px-5 py-7 text-[15px] text-slate-600 sm:px-6">No matching record was found in another growing area.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {workerTraces.slice(0, 6).map((trace, index) => (
                  <div key={`${trace.targetPlantId}-${trace.workerName}-${index}`} className="grid gap-3 px-5 py-4 sm:px-6 lg:grid-cols-[1fr_1.2fr_auto] lg:items-center">
                    <div><p className="text-[15px] font-semibold text-slate-900">{trace.workerName}</p><p className="mt-1 text-[13px] text-slate-500">field worker</p></div>
                    <div><p className="text-[15px] font-medium text-slate-700">{trace.symptomName}</p><p className="mt-1 text-[13px] text-slate-500">{trace.sourceGrid} → {trace.targetGrid}</p></div>
                    <div className="lg:text-right"><Link href={`/plants/${trace.targetPlantId}`} className="text-[15px] font-semibold text-[#2f6f78]">{trace.targetPlantCode}</Link><p className="mt-1 text-[13px] text-slate-500">{formatDate(trace.observedAt)}</p></div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <details className="admin-card group overflow-hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3"><Info className="size-5 text-slate-500" /><div><p className="text-[15px] font-semibold text-slate-900">Technical details for reviewers</p><p className="mt-0.5 text-[13px] text-slate-500">Database traversal used for this screen</p></div></div>
              <span className="text-[13px] text-slate-500 group-open:hidden">Show</span><span className="hidden text-[13px] text-slate-500 group-open:inline">Hide</span>
            </summary>
            <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-[14px] leading-6 text-slate-600 sm:px-6">The application follows several relationship paths in CognoDB, including shared symptoms, nearby trees, shared treatments, and cross-area worker observations. This technical view is intentionally secondary so everyday users see the decision first, not the database model.</div>
          </details>
        </>
      )}
    </div>
  );
}
