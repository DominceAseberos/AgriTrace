import { NextResponse } from "next/server";
import { getPlants } from "@/lib/cognodb/service";

export const dynamic = "force-dynamic";

/**
 * Lightweight read endpoint used by the live catalog filters. It deliberately
 * disables caching because every response reflects the current CognoDB state.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const species = searchParams.get("species") ?? "";

  const result = await getPlants({ query, status, species, limit: 250 });

  if (!result.ok) {
    const statusCode = result.error.code === "DB_UNAVAILABLE" ? 503 : 500;
    return NextResponse.json(
      { ok: false, error: result.error.message },
      { status: statusCode, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { ok: true, data: result.data },
    { headers: { "Cache-Control": "no-store" } },
  );
}
