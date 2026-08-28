import { NextResponse } from "next/server";
import { getPlants } from "@/lib/cognodb/service";

export const dynamic = "force-dynamic";

// WHAT: Supplies live tree-search/filter results to the catalog without a page reload.
// HOW: Reads query parameters, calls getPlants(), and returns uncached JSON.
// DO: Keep database validation/error handling in the service layer.
// DON'T: Cache these responses or construct Cypher directly inside this route.
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
