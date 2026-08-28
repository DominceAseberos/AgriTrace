import type { Metadata } from "next";
import { DatabaseErrorState } from "@/components/state-panels";
import { TreeBrowser } from "@/components/tree-browser";
import { getPlants } from "@/lib/cognodb/service";

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
      <header>
        <p className="text-sm font-medium text-slate-500">Agarwood plantation</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em] text-slate-900">Agarwood trees</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-6 text-slate-600">Find a tree by ID, species, growing area, or health status. Results update automatically as you search or filter.</p>
      </header>

      <TreeBrowser
        initialPlants={result.data}
        initialFilters={{ q: query, status, species }}
      />
    </div>
  );
}
