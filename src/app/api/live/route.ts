import { NextResponse } from "next/server";
import { getLive } from "@/lib/xtream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let cache: { at: number; data: Awaited<ReturnType<typeof getLive>> } | null = null;
const CACHE_TTL_MS = 60_000;

export async function GET() {
  try {
    const now = Date.now();
    if (cache && now - cache.at < CACHE_TTL_MS) {
      return NextResponse.json(cache.data, { status: 200, headers: { "cache-control": "private, max-age=30" } });
    }
    const data = await getLive();
    cache = { at: now, data };
    return NextResponse.json(data, { status: 200, headers: { "cache-control": "private, max-age=30" } });
  } catch (error) {
    console.error("/api/live error", error);
    return NextResponse.json(
      { error: "שגיאה בשליפת ערוצי הטלוויזיה החיים" },
      { status: 500 },
    );
  }
}
