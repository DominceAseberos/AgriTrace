"use client";

/**
 * Interactive tree catalog.
 *
 * The server renders the initial dataset, then filter changes fetch /api/plants
 * without navigating the page. Only the results region shows a skeleton while
 * CognoDB is queried. Search is debounced; select filters update immediately.
 */

import Link from "next/link";
import { ArrowUpRight, Filter, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ClickableTableRow } from "@/components/clickable-table-row";
import { StatusPill } from "@/components/status-pill";
import type { PlantSummary } from "@/lib/cognodb/types";
import { formatDate } from "@/lib/utils";

type FilterState = {
  q: string;
  status: string;
  species: string;
};

type Props = {
  initialPlants: PlantSummary[];
  initialFilters: FilterState;
};

function ResultsSkeleton() {
  return (
    <div className="admin-card overflow-hidden" data-testid="tree-results-skeleton" aria-label="Loading tree results">
      <div className="divide-y divide-slate-100 md:hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="animate-pulse px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="h-5 w-20 rounded bg-slate-200" />
                <div className="h-4 w-36 rounded bg-slate-100" />
              </div>
              <div className="h-7 w-24 rounded-full bg-slate-100" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="space-y-2"><div className="h-3 w-20 rounded bg-slate-100" /><div className="h-4 w-28 rounded bg-slate-200" /></div>
              <div className="space-y-2"><div className="h-3 w-20 rounded bg-slate-100" /><div className="h-4 w-28 rounded bg-slate-200" /></div>
            </div>
            <div className="mt-4 space-y-2"><div className="h-3 w-16 rounded bg-slate-100" /><div className="h-4 w-3/4 rounded bg-slate-200" /></div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden md:block">
        <div className="grid grid-cols-[0.7fr_1.2fr_0.9fr_1fr_1.5fr_1fr_40px] gap-5 bg-slate-50 px-5 py-3">
          {Array.from({ length: 7 }).map((_, index) => <div key={index} className="h-3 rounded bg-slate-200" />)}
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 7 }).map((_, row) => (
            <div key={row} className="grid animate-pulse grid-cols-[0.7fr_1.2fr_0.9fr_1fr_1.5fr_1fr_40px] items-center gap-5 px-5 py-[18px]">
              <div className="h-4 w-16 rounded bg-slate-200" />
              <div className="h-4 w-32 rounded bg-slate-100" />
              <div className="h-7 w-24 rounded-full bg-slate-100" />
              <div className="h-4 w-24 rounded bg-slate-100" />
              <div className="h-4 w-40 rounded bg-slate-100" />
              <div className="h-4 w-24 rounded bg-slate-100" />
              <div className="h-4 w-4 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Results({ plants }: { plants: PlantSummary[] }) {
  if (plants.length === 0) {
    return (
      <div className="admin-card px-5 py-12 text-center" data-testid="tree-results">
        <div className="mx-auto grid size-11 place-items-center rounded-full bg-slate-100 text-slate-500"><Search className="size-5" /></div>
        <h2 className="mt-4 text-base font-semibold text-slate-900">No trees match these filters</h2>
        <p className="mx-auto mt-2 max-w-md text-[14px] leading-6 text-slate-500">Try a different tree ID, area, species, or health status.</p>
      </div>
    );
  }

  return (
    <div className="admin-card overflow-hidden" data-testid="tree-results">
      <div className="divide-y divide-slate-100 md:hidden">
        {plants.map((plant) => (
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
            {plants.map((plant) => (
              <ClickableTableRow key={plant.id} href={`/plants/${plant.id}`} label={`Open ${plant.code} tree record`}>
                <td className="px-5 py-4 font-semibold text-slate-900">{plant.code}</td>
                <td className="px-5 py-4 italic text-slate-600">{plant.species}</td>
                <td className="px-5 py-4"><StatusPill status={plant.status} /></td>
                <td className="px-5 py-4 text-slate-700">{plant.gridName}</td>
                <td className="max-w-[260px] px-5 py-4 text-slate-600">{plant.symptoms.length ? plant.symptoms.join(", ") : "None recorded"}</td>
                <td className="px-5 py-4 text-slate-500">{formatDate(plant.latestObservedAt)}</td>
                <td className="px-5 py-4"><ArrowUpRight className="size-4 text-slate-400" aria-hidden="true" /></td>
              </ClickableTableRow>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TreeBrowser({ initialPlants, initialFilters }: Props) {
  const [plants, setPlants] = useState(initialPlants);
  const [query, setQuery] = useState(initialFilters.q);
  const [status, setStatus] = useState(initialFilters.status);
  const [species, setSpecies] = useState(initialFilters.species);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    requestRef.current?.abort();
  }, []);

  const load = (filters: FilterState, delay = 0) => {
    // Cancel stale debounce timers and in-flight requests so fast typing cannot overwrite newer results.
    if (timerRef.current) window.clearTimeout(timerRef.current);
    requestRef.current?.abort();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filters.q.trim()) params.set("q", filters.q.trim());
    if (filters.status) params.set("status", filters.status);
    if (filters.species) params.set("species", filters.species);

    const queryString = params.toString();
    const pageUrl = queryString ? `/plants?${queryString}` : "/plants";
    // Preserve shareable filter URLs without triggering a Next.js navigation or full-page refresh.
    window.history.replaceState(window.history.state, "", pageUrl);

    timerRef.current = window.setTimeout(async () => {
      const controller = new AbortController();
      requestRef.current = controller;

      try {
        const response = await fetch(`/api/plants${queryString ? `?${queryString}` : ""}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const payload = await response.json() as { ok: boolean; data?: PlantSummary[]; error?: string };
        if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || "Unable to load trees.");
        setPlants(payload.data);
      } catch (requestError) {
        if (controller.signal.aborted) return;
        setError(requestError instanceof Error ? requestError.message : "Unable to load trees.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, delay);
  };

  const currentFilters = { q: query, status, species };
  const hasFilters = Boolean(query || status || species);

  return (
    <div className="space-y-4">
      <div className="flex justify-end" aria-live="polite">
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[14px] font-medium text-slate-600">
          {loading ? "Updating trees…" : `${plants.length} tree${plants.length === 1 ? "" : "s"} shown`}
        </div>
      </div>

      <div className="admin-card grid gap-3 p-4 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
        <label className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 focus-within:border-[#9bc3ca] focus-within:bg-white">
          <Search className="size-4 shrink-0 text-slate-400" />
          <span className="sr-only">Search trees</span>
          <input
            name="q"
            value={query}
            onChange={(event) => {
              const value = event.target.value;
              setQuery(value);
              load({ q: value, status, species }, 300);
            }}
            placeholder="Search tree ID, species, or area"
            autoComplete="off"
            className="w-full bg-transparent text-[15px] text-slate-800 outline-none placeholder:text-slate-400"
          />
        </label>

        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[14px] text-slate-600">
          <Filter className="size-4" />
          <span className="sr-only">Filter by health status</span>
          <select
            name="status"
            value={status}
            onChange={(event) => {
              const value = event.target.value;
              setStatus(value);
              load({ q: query, status: value, species });
            }}
            className="bg-transparent outline-none"
          >
            <option value="">Any status</option>
            <option value="critical">Urgent</option>
            <option value="watch">Needs attention</option>
            <option value="healthy">Healthy</option>
          </select>
        </label>

        <label className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[14px] text-slate-600">
          <span className="sr-only">Filter by species</span>
          <select
            name="species"
            value={species}
            onChange={(event) => {
              const value = event.target.value;
              setSpecies(value);
              load({ q: query, status, species: value });
            }}
            className="w-full bg-transparent outline-none"
          >
            <option value="">Both species</option>
            <option value="Aquilaria malaccensis">A. malaccensis</option>
            <option value="Aquilaria crassna">A. crassna</option>
          </select>
        </label>

        {hasFilters ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStatus("");
              setSpecies("");
              load({ q: "", status: "", species: "" });
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="size-4" /> Clear
          </button>
        ) : (
          <p className="px-2 text-[13px] text-slate-400 lg:text-right">Updates automatically</p>
        )}
      </div>

      <div aria-live="polite" aria-busy={loading}>
        {loading ? (
          <ResultsSkeleton />
        ) : error ? (
          <div className="admin-card px-5 py-10 text-center">
            <h2 className="text-base font-semibold text-slate-900">Couldn&apos;t update the tree list</h2>
            <p className="mx-auto mt-2 max-w-lg text-[14px] leading-6 text-slate-500">{error}</p>
            <button type="button" onClick={() => load(currentFilters)} className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[14px] font-semibold text-slate-700 hover:bg-slate-50">Try again</button>
          </div>
        ) : (
          <Results plants={plants} />
        )}
      </div>
    </div>
  );
}
