import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, GitBranch, MapPin, Network, Sprout, Stethoscope, UsersRound } from "lucide-react";
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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href={`/plants/${source.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-black/45 transition hover:text-black"><ArrowLeft className="size-4" /> Back to {source.code}</Link>
        <div className="flex items-center gap-2 rounded-full bg-black/5 px-3 py-1.5 text-xs text-black/48"><GitBranch className="size-3.5" /> Multi-hop graph investigation</div>
      </div>

      <header className="grid gap-7 border-b border-black/10 pb-8 xl:grid-cols-[1fr_auto] xl:items-end">
        <div>
          <p className="eyebrow">Trace related cases</p>
          <div className="mt-3 flex flex-wrap items-center gap-4"><h1 className="text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">{source.code}</h1><StatusPill status={source.status} /></div>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-black/55">The graph follows shared symptoms, proximity, treatment history and cross-grid worker recording paths. Every related plant below includes the reason it was ranked.</p>
        </div>
        <div className="grid grid-cols-3 gap-5 rounded-[24px] bg-white/48 px-6 py-5 text-center">
          <div><div className="text-3xl font-semibold tracking-[-0.05em]">{relatedCases.length}</div><p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/38">Related</p></div>
          <div><div className="text-3xl font-semibold tracking-[-0.05em]">{relatedCases.filter((item) => item.strength === "high").length}</div><p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/38">High</p></div>
          <div><div className="text-3xl font-semibold tracking-[-0.05em]">{workerTraces.length}</div><p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/38">Worker paths</p></div>
        </div>
      </header>

      {relatedCases.length === 0 ? (
        <EmptyState title="No related cases found" message="This plant currently has no shared symptom, treatment, proximity or worker-trace relationships to other recorded cases." />
      ) : (
        <section className="grid gap-6 2xl:grid-cols-[1.25fr_0.75fr]">
          <div>
            <div className="mb-4 flex items-center justify-between"><div><p className="eyebrow">Relationship map</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">How the evidence connects</h2></div><span className="hidden text-xs text-black/40 sm:block">Selected plant → evidence → related plant</span></div>
            <InvestigationGraph graph={graph} />
          </div>

          <aside>
            <div className="mb-4"><p className="eyebrow">Ranked evidence</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Why these cases surfaced</h2></div>
            <div className="max-h-[680px] space-y-3 overflow-y-auto pr-1">
              {relatedCases.map((item, index) => (
                <article key={item.plant.id} className="rounded-[25px] bg-white/52 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-black/5 text-xs font-semibold text-black/45">{String(index + 1).padStart(2, "0")}</span><div><Link href={`/plants/${item.plant.id}`} className="font-semibold tracking-[-0.02em] hover:underline">{item.plant.code}</Link><p className="mt-0.5 text-xs text-black/40">{item.plant.gridName}</p></div></div>
                    <div className="text-right"><span className="text-xs font-semibold capitalize text-[var(--forest)]">{item.strength}</span><p className="mt-0.5 text-[10px] text-black/35">score {item.score}</p></div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {item.reasons.map((reason) => {
                      const Icon = reasonIcon[reason.type];
                      return (
                        <div key={`${reason.type}-${reason.label}`} className="grid grid-cols-[28px_1fr] gap-2.5">
                          <span className="grid size-7 place-items-center rounded-full bg-[var(--forest)]/7 text-[var(--forest)]"><Icon className="size-3.5" /></span>
                          <div><p className="text-xs font-semibold">{reason.label}</p><p className="mt-1 text-xs leading-5 text-black/48">{reason.detail}</p></div>
                        </div>
                      );
                    })}
                  </div>
                  <Link href={`/plants/${item.plant.id}`} className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--forest)]">Open plant record <ArrowUpRight className="size-3.5" /></Link>
                </article>
              ))}
            </div>
          </aside>
        </section>
      )}

      <section className="border-t border-black/10 pt-9">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="eyebrow">Relationally awkward query</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">Cross-grid worker trace.</h2>
            <p className="mt-4 text-sm leading-7 text-black/55">This path asks whether the same worker recorded the same symptom on another plant in a different grid. It walks through multiple typed relationships instead of stitching together several join tables.</p>
            <div className="mt-5 rounded-[20px] bg-[var(--ink)] px-4 py-3 font-mono text-[11px] leading-5 text-white/70">Plant → Observation ← Worker → Observation → Symptom ← Observation ← Plant</div>
          </div>
          {workerTraces.length === 0 ? (
            <div className="rounded-[26px] bg-black/[0.035] p-7 text-sm leading-6 text-black/45">No cross-grid worker trace was found for this plant. That is a valid empty graph result.</div>
          ) : (
            <div className="divide-y divide-black/8 rounded-[28px] bg-white/48 px-5 sm:px-7">
              {workerTraces.slice(0, 8).map((trace, index) => (
                <div key={`${trace.targetPlantId}-${trace.workerName}-${index}`} className="grid gap-3 py-5 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                  <div><p className="text-sm font-semibold">{trace.workerName}</p><p className="mt-1 text-xs text-black/42">same recorder</p></div>
                  <div><p className="text-sm font-medium text-black/65">{trace.symptomName}</p><p className="mt-1 text-xs text-black/42">{trace.sourceGrid} → {trace.targetGrid}</p></div>
                  <div className="sm:text-right"><Link href={`/plants/${trace.targetPlantId}`} className="text-sm font-semibold text-[var(--forest)]">{trace.targetPlantCode}</Link><p className="mt-1 text-xs text-black/38">{formatDate(trace.observedAt)}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
