import { NextResponse } from "next/server";
import { getVod } from "@/lib/xtream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getVod();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("/api/vod error", error);
    return NextResponse.json(
      { error: "שגיאה בשליפת ספריית ה-VOD" },
      { status: 500 },
    );
  }
}
