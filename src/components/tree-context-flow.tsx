import { Building2, CalendarCheck, ChevronDown, ChevronRight, MapPin, Stethoscope, Trees } from "lucide-react";
import type { PlantDetail } from "@/lib/cognodb/types";
import { formatDate } from "@/lib/utils";

function Step({ icon: Icon, label, value, tone = "slate" }: { icon: typeof Trees; label: string; value: string; tone?: "slate" | "teal" | "amber" }) {
  const toneClass = tone === "teal"
    ? "border-[#cfe4e8] bg-[#f2f8f9] text-[#245d65]"
    : tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-slate-200 bg-white text-slate-700";

  return (
    <div className={`min-w-0 flex-1 rounded-xl border p-4 ${toneClass}`}>
      <div className="flex items-center gap-2 text-[13px] font-medium opacity-70"><Icon className="size-4 shrink-0" /> {label}</div>
      <p className="mt-2 break-words text-[15px] font-semibold leading-6 text-slate-900">{value}</p>
    </div>
  );
}

function Connector() {
  return (
    <div className="grid shrink-0 place-items-center px-1 py-1 text-slate-300 md:px-0">
      <ChevronDown className="size-5 md:hidden" />
      <ChevronRight className="hidden size-5 md:block" />
    </div>
  );
}

export function TreeContextFlow({ tree }: { tree: PlantDetail }) {
  const latestInspection = tree.observations[0];
  const latestTreatment = tree.treatments[0];
  const symptomText = tree.symptoms.length ? tree.symptoms.join(", ") : "No symptoms recorded";
  const treatmentText = latestTreatment ? `${latestTreatment.name} · ${latestTreatment.outcome === "improved" ? "Improved" : latestTreatment.outcome === "declined" ? "Got worse" : "No clear change"}` : "No treatment recorded";

  return (
    <section className="admin-card overflow-hidden" aria-labelledby="tree-context-heading">
      <div className="admin-card-header">
        <div>
          <h2 id="tree-context-heading" className="text-base font-semibold text-slate-900">Where this tree fits</h2>
          <p className="mt-1 text-[13px] text-slate-500">Farm → growing area → tree → latest field record</p>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex flex-col items-stretch md:flex-row md:items-center">
          <Step icon={Building2} label="Farm" value={tree.companyName} />
          <Connector />
          <Step icon={MapPin} label="Growing area" value={tree.gridName} />
          <Connector />
          <Step icon={Trees} label="Agarwood tree" value={`${tree.code} · ${tree.species}`} tone="teal" />
          <Connector />
          <Step icon={CalendarCheck} label="Latest inspection" value={latestInspection ? `${formatDate(latestInspection.observedAt)} · ${latestInspection.workerName}` : "No inspection recorded"} />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-[13px] font-medium text-amber-800"><Stethoscope className="size-4" /> What was noticed</div>
            <p className="mt-2 text-[15px] font-semibold leading-6 text-slate-900">{symptomText}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex items-center gap-2 text-[13px] font-medium text-emerald-800"><CalendarCheck className="size-4" /> Latest treatment</div>
            <p className="mt-2 text-[15px] font-semibold leading-6 text-slate-900">{treatmentText}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
