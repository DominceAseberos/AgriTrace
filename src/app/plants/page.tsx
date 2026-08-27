import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Filter, Search } from "lucide-react";
import { DatabaseErrorState, EmptyState } from "@/components/state-panels";
import { StatusPill } from "@/components/status-pill";
import { getPlants } from "@/lib/cognodb/service";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Agarwood Trees" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PlantsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "";
  const species = typeof params.species === "string" ? params.species : "";
  const result = await getPlants({ query, status, species, limit: 250 });
  if (!result.ok) return <DatabaseErrorState message={result.error.message} />;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Agarwood plantation</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em] text-slate-900">Agarwood trees</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-6 text-slate-600">Find a tree by ID, species, growing area, or health status.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[14px] font-medium text-slate-600">{result.data.length} tree{result.data.length === 1 ? "" : "s"} shown</div>
      </header>

      <form method="GET" className="admin-card grid gap-3 p-4 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
        <label className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
          <Search className="size-4 shrink-0 text-slate-400" />
          <span className="sr-only">Search trees</span>
          <input name="q" defaultValue={query} placeholder="Search tree ID, species, or area" className="w-full bg-transparent text-[15px] text-slate-800 outline-none placeholder:text-slate-400" />
        </label>

        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[14px] text-slate-600">
          <Filter className="size-4" />
          <span className="sr-only">Filter by health status</span>
          <select name="status" defaultValue={status} className="bg-transparent outline-none">
            <option value="">Any status</option>
            <option value="critical">Urgent</option>
            <option value="watch">Needs attention</option>
            <option value="healthy">Healthy</option>
          </select>
        </label>

        <label className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[14px] text-slate-600">
          <span className="sr-only">Filter by species</span>
          <select name="species" defaultValue={species} className="w-full bg-transparent outline-none">
            <option value="">Both species</option>
            <option value="Aquilaria malaccensis">A. malaccensis</option>
            <option value="Aquilaria crassna">A. crassna</option>
          </select>
        </label>

        <button className="rounded-lg bg-[#2f6f78] px-5 py-2.5 text-[15px] font-semibold text-white shadow-sm hover:bg-[#245d65]">Show results</button>
      </form>

      {result.data.length === 0 ? (
        <EmptyState title="No trees match these filters" message="Try a different tree ID, area, species, or health status." />
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="divide-y divide-slate-100 md:hidden">
            {result.data.map((plant) => (
              <Link key={plant.id} href={`/plants/${plant.id}`} className="block px-5 py-4 transition hover:bg-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{plant.code}</p>
                    <p className="mt-1 text-[14px] italic text-slate-600">{plant.species}</p>
                  </div>
                  <StatusPill status={plant.status} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-[14px]">
                  <div><p className="text-[13px] text-slate-500">Growing area</p><p className="mt-0.5 font-medium text-slate-700">{plant.gridName}</p></div>
                  <div><p className="text-[13px] text-slate-500">Last checked</p><p className="mt-0.5 font-medium text-slate-700">{formatDate(plant.latestObservedAt)}</p></div>
                </div>
                <div className="mt-4"><p className="text-[13px] text-slate-500">Symptoms</p><p className="mt-0.5 text-[14px] text-slate-700">{plant.symptoms.length ? plant.symptoms.join(", ") : "None recorded"}</p></div>
              </Link>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[880px] text-left">
              <thead className="bg-slate-50 text-[13px] text-slate-500">
                <tr><th className="px-5 py-3 font-semibold">Tree ID</th><th className="px-5 py-3 font-semibold">Species</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Growing area</th><th className="px-5 py-3 font-semibold">Symptoms</th><th className="px-5 py-3 font-semibold">Last checked</th><th /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[14px]">
                {result.data.map((plant) => (
                  <tr key={plant.id} className="transition hover:bg-slate-50/80">
                    <td className="px-5 py-4"><Link href={`/plants/${plant.id}`} className="font-semibold text-slate-900 hover:text-[#2f6f78]">{plant.code}</Link></td>
                    <td className="px-5 py-4 italic text-slate-600">{plant.species}</td>
                    <td className="px-5 py-4"><StatusPill status={plant.status} /></td>
                    <td className="px-5 py-4 text-slate-700">{plant.gridName}</td>
                    <td className="max-w-[260px] px-5 py-4 text-slate-600">{plant.symptoms.length ? plant.symptoms.join(", ") : "None recorded"}</td>
                    <td className="px-5 py-4 text-slate-500">{formatDate(plant.latestObservedAt)}</td>
                    <td className="px-5 py-4"><ArrowUpRight className="size-4 text-slate-400" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
