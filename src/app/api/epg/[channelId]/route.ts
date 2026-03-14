import { NextResponse } from "next/server";
import { getEpg } from "@/lib/xtream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  channelId: string;
}

export async function GET(_request: Request, context: { params: Promise<Params> }) {
  const { channelId } = await context.params;
  const streamId = Number(channelId);

  if (Number.isNaN(streamId)) {
    return NextResponse.json(
      { error: "channelId חייב להיות מספר" },
      { status: 400 },
    );
  }

  try {
    const data = await getEpg(streamId);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error(`/api/epg/${channelId} error`, error);
    return NextResponse.json(
      { error: "שגיאה בשליפת לוח השידורים" },
      { status: 500 },
    );
  }
}
