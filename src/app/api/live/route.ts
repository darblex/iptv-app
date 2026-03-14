import { NextResponse } from "next/server";
import { getLive } from "@/lib/xtream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getLive();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("/api/live error", error);
    return NextResponse.json(
      { error: "שגיאה בשליפת ערוצי הטלוויזיה החיים" },
      { status: 500 },
    );
  }
}
