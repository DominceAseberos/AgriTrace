import { NextResponse } from "next/server";
import { verifyDatabase } from "@/lib/cognodb/driver";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await verifyDatabase();
  return NextResponse.json(
    result.ok ? { ok: true, database: "reachable" } : { ok: false, database: "unreachable" },
    { status: result.ok ? 200 : 503 },
  );
}
