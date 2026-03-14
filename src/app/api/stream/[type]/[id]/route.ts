import { NextResponse } from "next/server";
import { StreamType, resolveStreamUrl } from "@/lib/xtream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  type: string;
  id: string;
}

const ALLOWED_TYPES: StreamType[] = ["live", "vod", "series"];

export async function GET(request: Request, context: { params: Promise<Params> }) {
  const { type, id } = await context.params;

  if (!ALLOWED_TYPES.includes(type as StreamType)) {
    return NextResponse.json(
      { error: "סוג הזרם לא נתמך" },
      { status: 400 },
    );
  }

  const numericId = Number(id);
  if (Number.isNaN(numericId)) {
    return NextResponse.json(
      { error: "מזהה הזרם חייב להיות מספר" },
      { status: 400 },
    );
  }

  try {
    const streamUrl = await resolveStreamUrl(type as StreamType, numericId);
    const range = request.headers.get("range");

    const upstreamHeaders: HeadersInit = {
      "User-Agent": request.headers.get("user-agent") ?? "iptv-proxy",
    };

    if (range) {
      upstreamHeaders.Range = range;
    }

    const upstream = await fetch(streamUrl, {
      headers: upstreamHeaders,
      cache: "no-store",
    });

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json(
        { error: "הזרם אינו זמין כעת" },
        { status: upstream.status },
      );
    }

    const headersToForward = [
      "content-type",
      "content-length",
      "accept-ranges",
      "content-range",
      "cache-control",
    ];

    const responseHeaders = new Headers();
    headersToForward.forEach((header) => {
      const value = upstream.headers.get(header);
      if (value) {
        responseHeaders.set(header, value);
      }
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`/api/stream/${type}/${id} error`, error);
    return NextResponse.json(
      { error: "שגיאה בהפעלת הזרם" },
      { status: 500 },
    );
  }
}
