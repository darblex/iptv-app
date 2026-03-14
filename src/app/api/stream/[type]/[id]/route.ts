import { NextResponse } from "next/server";
import { StreamType, resolveStreamUrl, getPrimaryHost, getVodInfo, getSeriesInfo } from "@/lib/xtream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  type: string;
  id: string;
}

const ALLOWED_TYPES: StreamType[] = ["live", "vod", "series"];
const MAX_REDIRECTS = 8;

const UPSTREAM_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "*/*",
  Connection: "keep-alive",
};

function rewriteRedirectUrl(location: string, primaryHost: string): string {
  try {
    const parsed = new URL(location);
    if (parsed.hostname !== primaryHost) {
      parsed.hostname = primaryHost;
      parsed.port = "";
    }
    return parsed.toString();
  } catch {
    return location;
  }
}

async function fetchWithFallback(
  url: string,
  primaryHost: string,
  headers: HeadersInit,
): Promise<Response> {
  try {
    return await fetch(url, {
      headers,
      cache: "no-store",
      redirect: "follow",
    });
  } catch {
    let currentUrl = url;

    for (let i = 0; i < MAX_REDIRECTS; i++) {
      const res = await fetch(currentUrl, {
        headers,
        cache: "no-store",
        redirect: "manual",
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) break;
        currentUrl = rewriteRedirectUrl(location, primaryHost);
        continue;
      }

      return res;
    }

    return fetch(url, { headers, cache: "no-store", redirect: "follow" });
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<Params> },
) {
  const { type, id } = await context.params;

  if (!ALLOWED_TYPES.includes(type as StreamType)) {
    return NextResponse.json({ error: "סוג הזרם לא נתמך" }, { status: 400 });
  }

  const numericId = Number(id);
  if (
    !Number.isFinite(numericId) ||
    numericId <= 0 ||
    !Number.isInteger(numericId)
  ) {
    return NextResponse.json({ error: "מזהה זרם לא תקין" }, { status: 400 });
  }

  try {
    const url = new URL(request.url);
    let streamUrl = "";

    if (type === "vod") {
      let ext = url.searchParams.get("ext");
      if (!ext) {
        try {
          const info = await getVodInfo(numericId);
          ext = info.movie_data?.container_extension ?? null;
        } catch (e) {
          console.error("Failed to fetch vod info", e);
        }
      }
      streamUrl = await resolveStreamUrl("vod", numericId, ext || "mp4");
    } else if (type === "series") {
      const season = url.searchParams.get("season") || "1";
      const episode = url.searchParams.get("episode") || "1";
      try {
        const info = await getSeriesInfo(numericId);
        const seasonEpisodes = info.episodes?.[season] || [];
        const epObj = seasonEpisodes.find((e) => e.episode_num == episode || e.info?.episode == episode) 
                      || seasonEpisodes[Number(episode) - 1];

        if (epObj) {
          streamUrl = await resolveStreamUrl("series", epObj.id, epObj.container_extension || "mp4");
        } else {
          streamUrl = await resolveStreamUrl("series", numericId, "mp4");
        }
      } catch (e) {
        console.error("Failed to fetch series info", e);
        streamUrl = await resolveStreamUrl("series", numericId, "mp4");
      }
    } else {
      streamUrl = await resolveStreamUrl(type as StreamType, numericId);
    }

    const primaryHost = getPrimaryHost();
    const range = request.headers.get("range");

    const headers: Record<string, string> = { ...UPSTREAM_HEADERS } as Record<
      string,
      string
    >;
    if (range) headers.Range = range;

    const upstream = await fetchWithFallback(streamUrl, primaryHost, headers);
    const contentType = upstream.headers.get("content-type") ?? "";

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json(
        { error: "הזרם אינו זמין כעת" },
        { status: upstream.status },
      );
    }

    const isMediaContent =
      contentType.startsWith("video/") ||
      contentType.startsWith("audio/") ||
      contentType.includes("mpegurl") ||
      contentType.includes("octet-stream") ||
      contentType.includes("mp2t");

    if (!isMediaContent) {
      const text = await upstream.text();
      if (
        text.includes("FORCED_COUNTRY_INVALID") ||
        text.includes("Country does not match")
      ) {
        return NextResponse.json(
          { error: "הצפייה מוגבלת למיקום גיאוגרפי מסוים (Geo-Blocked)" },
          { status: 403 },
        );
      }
      return NextResponse.json(
        { error: "הזרם אינו זמין כעת" },
        { status: 503 },
      );
    }

    const responseHeaders = new Headers();
    for (const h of [
      "content-type",
      "content-length",
      "accept-ranges",
      "content-range",
      "cache-control",
    ]) {
      const v = upstream.headers.get(h);
      if (v) responseHeaders.set(h, v);
    }

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

/** HEAD handler so the client can probe availability without downloading. */
export async function HEAD(
  request: Request,
  context: { params: Promise<Params> },
) {
  const response = await GET(request, context);
  return new NextResponse(null, {
    status: response.status,
    headers: response.headers,
  });
}
