import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, ClipboardCheck, Network, Sprout } from "lucide-react";
import { DatabaseErrorState, NotFoundState } from "@/components/state-panels";
import { StatusPill } from "@/components/status-pill";
import { getPlantDetail } from "@/lib/cognodb/service";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Plant ${id}` };
}

export default async function PlantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getPlantDetail(id);
  if (!result.ok) {
    if (result.error.code === "NOT_FOUND") return <NotFoundState />;
    return <DatabaseErrorState message={result.error.message} />;
  }

  const plant = result.data;

  return (
    <div className="space-y-8">
      <Link href="/plants" className="inline-flex items-center gap-2 text-sm font-semibold text-black/45 transition hover:text-black"><ArrowLeft className="size-4" /> All plants</Link>

      <section className="grid gap-8 border-b border-black/10 pb-9 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3"><StatusPill status={plant.status} /><span className="text-xs text-black/38">{plant.gridName} · {plant.companyName}</span></div>
          <h1 className="text-6xl font-semibold tracking-[-0.065em] sm:text-7xl">{plant.code}</h1>
          <p className="mt-3 text-base italic text-black/48">{plant.species}</p>
        </div>
        <Link href={`/investigate/${plant.id}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--forest)] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">
          <Network className="size-4" /> Trace related cases <ArrowUpRight className="size-4" />
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="soft-panel rounded-[26px] p-6">
          <Sprout className="size-5 text-[var(--moss)]" />
          <p className="eyebrow mt-5">Current signals</p>
          <p className="mt-2 text-xl font-semibold tracking-[-0.03em]">{plant.symptoms.length ? plant.symptoms.join(" · ") : "No active symptom tags"}</p>
        </div>
        <div className="soft-panel rounded-[26px] p-6">
          <CalendarDays className="size-5 text-[var(--moss)]" />
          <p className="eyebrow mt-5">Last observed</p>
          <p className="mt-2 text-xl font-semibold tracking-[-0.03em]">{formatDate(plant.latestObservedAt)}</p>
        </div>
        <div className="soft-panel rounded-[26px] p-6">
          <ClipboardCheck className="size-5 text-[var(--moss)]" />
          <p className="eyebrow mt-5">Treatment links</p>
          <p className="mt-2 text-xl font-semibold tracking-[-0.03em]">{plant.treatments.length} recorded</p>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="mb-5">
            <p className="eyebrow">Observation timeline</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Field evidence</h2>
          </div>
          <div className="space-y-3">
            {plant.observations.map((observation, index) => (
              <article key={observation.id} className="rounded-[26px] bg-white/45 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">{formatDate(observation.observedAt)}</p>
                    <p className="mt-1 text-xs text-black/40">Recorded by {observation.workerName}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-black/45"><span>Severity {observation.severity}/5</span><span className="size-1 rounded-full bg-black/25" /><span>Health {observation.healthScore}/100</span></div>
                </div>
                <p className="mt-5 text-sm leading-6 text-black/60">{observation.notes}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {observation.symptoms.map((symptom) => <span key={symptom} className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-black/58">{symptom}</span>)}
                  {observation.symptoms.length === 0 && <span className="text-xs text-black/35">Routine healthy observation</span>}
                </div>
                {index === 0 && <div className="mt-5 h-px bg-gradient-to-r from-[var(--moss)]/40 to-transparent" />}
              </article>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-5">
            <p className="eyebrow">RECEIVED relationships</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Treatment history</h2>
          </div>
          {plant.treatments.length === 0 ? (
            <div className="rounded-[26px] bg-black/[0.035] p-7 text-sm leading-6 text-black/48">No treatment relationship has been recorded for this plant.</div>
          ) : (
            <div className="space-y-3">
              {plant.treatments.map((treatment) => (
                <article key={`${treatment.id}-${treatment.appliedAt}`} className="rounded-[26px] bg-[var(--forest)] p-6 text-white">
                  <div className="flex items-start justify-between gap-3"><div><p className="text-lg font-semibold tracking-[-0.025em]">{treatment.name}</p><p className="mt-1 text-xs text-white/45">{treatment.category} · {formatDate(treatment.appliedAt)}</p></div><span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]">{treatment.outcome}</span></div>
                  <div className="mt-6 border-t border-white/12 pt-4 text-xs text-white/50">Relationship property · dosage: <span className="text-white/80">{treatment.dosage}</span></div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
