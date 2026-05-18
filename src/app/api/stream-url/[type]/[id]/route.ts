import { NextResponse } from "next/server";
import { StreamType, resolveDirectStreamUrl, getVodInfo, getSeriesInfo } from "@/lib/xtream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES: StreamType[] = ["live", "vod", "series"];

interface Params { type: string; id: string; }

/**
 * Returns the direct upstream stream URL so the client can connect
 * from their own IP instead of routing traffic through the Railway server.
 */
export async function GET(request: Request, context: { params: Promise<Params> }) {
  const { type, id } = await context.params;

  if (!ALLOWED_TYPES.includes(type as StreamType)) {
    return NextResponse.json({ error: "סוג לא נתמך" }, { status: 400 });
  }
  const numericId = Number(id);
  if (!Number.isFinite(numericId) || numericId <= 0 || !Number.isInteger(numericId)) {
    return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
  }

  try {
    const url = new URL(request.url);
    let streamUrl = "";

    if (type === "vod") {
      let ext = url.searchParams.get("ext");
      if (!ext) {
        try { const info = await getVodInfo(numericId); ext = info.movie_data?.container_extension ?? null; } catch { /* ignore */ }
      }
      streamUrl = await resolveDirectStreamUrl("vod", numericId, ext || "mp4");
    } else if (type === "series") {
      const season = url.searchParams.get("season") || "1";
      const episode = url.searchParams.get("episode") || "1";
      try {
        const info = await getSeriesInfo(numericId);
        const ep = (info.episodes?.[season] || [])[Number(episode) - 1];
        streamUrl = ep
          ? await resolveDirectStreamUrl("series", ep.id, ep.container_extension || "mp4")
          : await resolveDirectStreamUrl("series", numericId, "mp4");
      } catch {
        streamUrl = await resolveDirectStreamUrl("series", numericId, "mp4");
      }
    } else {
      // live — always direct, no relay
      streamUrl = await resolveDirectStreamUrl("live", numericId);
    }

    return NextResponse.json({ url: streamUrl }, {
      headers: { "access-control-allow-origin": "*", "cache-control": "no-store" },
    });
  } catch (error) {
    console.error(`/api/stream-url/${type}/${id} error`, error);
    return NextResponse.json({ error: "שגיאה בשליפת כתובת הזרם" }, { status: 500 });
  }
}
