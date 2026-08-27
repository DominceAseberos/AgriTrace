import { cn } from "@/lib/utils";
import type { PlantStatus } from "@/lib/cognodb/types";

const styles: Record<PlantStatus, string> = {
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-800",
  watch: "border-amber-200 bg-amber-50 text-amber-800",
  critical: "border-red-200 bg-red-50 text-red-800",
};

const labels: Record<PlantStatus, string> = {
  healthy: "Healthy",
  watch: "Needs attention",
  critical: "Urgent",
};

export function StatusPill({ status, className }: { status: PlantStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[13px] font-semibold", styles[status], className)}>
      <span className="mr-1.5 size-2 rounded-full bg-current opacity-65" />
      {labels[status]}
    </span>
  );
}
