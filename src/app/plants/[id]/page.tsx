import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, ClipboardCheck, MapPin, Trees } from "lucide-react";
import { DatabaseErrorState, NotFoundState } from "@/components/state-panels";
import { StatusPill } from "@/components/status-pill";
import { getPlantDetail } from "@/lib/cognodb/service";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Tree ${id}` };
}

export default async function PlantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getPlantDetail(id);
  if (!result.ok) {
    if (result.error.code === "NOT_FOUND") return <NotFoundState title="Tree not found" />;
    return <DatabaseErrorState message={result.error.message} />;
  }

  const plant = result.data;

  return (
    <div className="space-y-6">
      <Link href="/plants" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"><ArrowLeft className="size-4" /> Back to all trees</Link>

      <section className="admin-card overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-900">{plant.code}</h1><StatusPill status={plant.status} /></div>
            <p className="mt-2 text-[15px] italic text-slate-600">{plant.species}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[14px] text-slate-600">
              <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-slate-400" /> {plant.gridName}</span>
              <span>{plant.companyName}</span>
              <span>Planted {formatDate(plant.plantedAt)}</span>
            </div>
          </div>
          <Link href={`/investigate/${plant.id}`} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2f6f78] px-5 py-3 text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#245d65]">
            Check related trees <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
          <p className="text-[14px] leading-6 text-slate-700">
            {plant.status === "critical"
              ? "This tree is marked Urgent. Review its latest symptoms and related trees first."
              : plant.status === "watch"
                ? "This tree needs follow-up. Review the latest inspection and compare it with nearby or similar cases."
                : "This tree is currently healthy based on its latest recorded inspection."}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="info-box p-5">
          <Trees className="size-5 text-[#2f6f78]" />
          <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-500">Current symptoms</p>
          <p className="mt-2 text-lg font-semibold leading-7 text-slate-900">{plant.symptoms.length ? plant.symptoms.join(", ") : "None recorded"}</p>
        </div>
        <div className="info-box p-5">
          <CalendarDays className="size-5 text-[#2f6f78]" />
          <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-500">Last checked</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{formatDate(plant.latestObservedAt)}</p>
        </div>
        <div className="info-box p-5">
          <ClipboardCheck className="size-5 text-[#2f6f78]" />
          <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-500">Treatments recorded</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{plant.treatments.length}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="mb-3"><h2 className="text-xl font-semibold text-slate-900">Inspection history</h2><p className="mt-1 text-[14px] text-slate-500">What field staff observed over time</p></div>
          <div className="space-y-3">
            {plant.observations.map((observation) => (
              <article key={observation.id} className="admin-card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div><p className="text-[15px] font-semibold text-slate-900">{formatDate(observation.observedAt)}</p><p className="mt-1 text-[13px] text-slate-500">Checked by {observation.workerName}</p></div>
                  <div className="flex flex-wrap gap-2 text-[13px] text-slate-600"><span className="rounded-md bg-slate-100 px-2.5 py-1.5">Severity {observation.severity} of 5</span><span className="rounded-md bg-slate-100 px-2.5 py-1.5">Health score {observation.healthScore}/100</span></div>
                </div>
                <p className="mt-4 text-[15px] leading-6 text-slate-700">{observation.notes}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {observation.symptoms.map((symptom) => <span key={symptom} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[13px] font-medium text-amber-800">{symptom}</span>)}
                  {observation.symptoms.length === 0 && <span className="text-[14px] text-slate-500">No symptoms recorded during this inspection.</span>}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3"><h2 className="text-xl font-semibold text-slate-900">Treatment history</h2><p className="mt-1 text-[14px] text-slate-500">What was applied and how the tree responded</p></div>
          {plant.treatments.length === 0 ? (
            <div className="admin-card p-5 text-[15px] leading-6 text-slate-600">No treatment has been recorded for this tree.</div>
          ) : (
            <div className="space-y-3">
              {plant.treatments.map((treatment) => (
                <article key={`${treatment.id}-${treatment.appliedAt}`} className="admin-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-base font-semibold text-slate-900">{treatment.name}</p><p className="mt-1 text-[13px] text-slate-500">{treatment.category} · {formatDate(treatment.appliedAt)}</p></div>
                    <span className={`rounded-full border px-2.5 py-1 text-[13px] font-semibold ${treatment.outcome === "improved" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : treatment.outcome === "declined" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{treatment.outcome === "improved" ? "Improved" : treatment.outcome === "declined" ? "Got worse" : "No clear change"}</span>
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-4 text-[14px] text-slate-600">Dose: <span className="font-medium text-slate-800">{treatment.dosage}</span></div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
