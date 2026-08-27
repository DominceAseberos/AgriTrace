import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Filter, Search } from "lucide-react";
import { DatabaseErrorState, EmptyState } from "@/components/state-panels";
import { StatusPill } from "@/components/status-pill";
import { getPlants } from "@/lib/cognodb/service";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Plants" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PlantsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "";
  const result = await getPlants({ query, status, limit: 250 });
  if (!result.ok) return <DatabaseErrorState message={result.error.message} />;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">Records / Plants</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-slate-900">Plant records</h1>
          <p className="mt-1 text-sm text-slate-500">Search records, review health signals, and open a plant to trace its graph relationships.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500">{result.data.length} matching plants</div>
      </header>

      <form method="GET" className="admin-card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
          <Search className="size-4 shrink-0 text-black/35" />
          <span className="sr-only">Search plants</span>
          <input name="q" defaultValue={query} placeholder="Search PL-011, Aquilaria, North Grove…" className="w-full bg-transparent text-sm outline-none placeholder:text-black/30" />
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500">
          <Filter className="size-4" />
          <span className="sr-only">Filter status</span>
          <select name="status" defaultValue={status} className="bg-transparent outline-none">
            <option value="">All health states</option>
            <option value="critical">Critical</option>
            <option value="watch">Watch</option>
            <option value="healthy">Healthy</option>
          </select>
        </label>
        <button className="rounded-lg bg-[#214b32] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#183a26]">Apply filters</button>
      </form>

      {result.data.length === 0 ? (
        <EmptyState title="No plants match those filters" message="Try another plant code, grid name, species or health state." />
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="hidden grid-cols-[0.8fr_1fr_1.05fr_1.4fr_0.8fr_auto] gap-5 border-b border-black/8 px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/38 lg:grid">
            <span>Plant</span><span>Health</span><span>Grid</span><span>Signals</span><span>Last seen</span><span />
          </div>
          <div className="divide-y divide-black/8">
            {result.data.map((plant) => (
              <Link key={plant.id} href={`/plants/${plant.id}`} className="group grid gap-3 px-5 py-4 transition hover:bg-slate-50 lg:grid-cols-[0.8fr_1fr_1.05fr_1.4fr_0.8fr_auto] lg:items-center lg:gap-5 lg:px-6">
                <div>
                  <p className="font-semibold tracking-[-0.02em]">{plant.code}</p>
                  <p className="mt-1 text-xs italic text-black/40">{plant.species}</p>
                </div>
                <div><StatusPill status={plant.status} /></div>
                <div>
                  <p className="text-sm font-medium text-black/70">{plant.gridName}</p>
                  <p className="mt-1 text-xs text-black/38">{plant.companyName}</p>
                </div>
                <p className="line-clamp-2 text-sm text-black/58">{plant.symptoms.length ? plant.symptoms.join(" · ") : "No active symptom connections"}</p>
                <p className="text-xs text-black/45">{formatDate(plant.latestObservedAt)}</p>
                <ArrowUpRight className="hidden size-4 text-black/25 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-black lg:block" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
