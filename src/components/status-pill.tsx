import { cn } from "@/lib/utils";
import type { PlantStatus } from "@/lib/cognodb/types";

const styles: Record<PlantStatus, string> = {
  healthy: "bg-emerald-950/8 text-emerald-950",
  watch: "bg-amber-500/14 text-amber-900",
  critical: "bg-red-500/12 text-red-800",
};

export function StatusPill({ status, className }: { status: PlantStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize tracking-[0.02em]", styles[status], className)}>
      <span className="mr-1.5 size-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
