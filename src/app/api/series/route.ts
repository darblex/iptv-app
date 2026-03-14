import { NextResponse } from "next/server";
import { getSeriesData } from "@/lib/xtream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getSeriesData();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("/api/series error", error);
    return NextResponse.json(
      { error: "שגיאה בשליפת ספריית הסדרות" },
      { status: 500 },
    );
  }
}
