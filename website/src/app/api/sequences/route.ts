import { NextRequest, NextResponse } from "next/server";
import { getSequences } from "@/lib/api";
import { normalizeSearchTerm } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchTerm = normalizeSearchTerm(
    request.nextUrl.searchParams.get("q") ?? "",
  );
  const result = await getSequences(searchTerm);
  const headers = { "Cache-Control": "no-store" };

  if (!result.ok) {
    return NextResponse.json(
      { error: "upstream unavailable" },
      { status: result.status, headers },
    );
  }

  return NextResponse.json(result.data, { headers });
}
