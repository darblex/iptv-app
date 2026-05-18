import { NextResponse } from "next/server";
import { StreamType, resolveStreamUrl, getVodInfo, getSeriesInfo } from "@/lib/xtream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  type: string;
  id: string;
}

const ALLOWED_TYPES: StreamType[] = ["live", "vod", "series"];
const MAX_REDIRECTS = 8;
const STALL_TIMEOUT_MS = 30_000;

const UPSTREAM_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "*/*",
  Connection: "keep-alive",
};

function isRedirect(status: number) {
  return status >= 300 && status < 400;
}

async function fetchWithFallback(url: string, headers: HeadersInit): Promise<Response> {
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

      if (isRedirect(res.status)) {
        const location = res.headers.get("location");
        if (!location) break;
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      return res;
    }

    return fetch(url, { headers, cache: "no-store", redirect: "follow" });
  }
}

function isM3u8(contentType: string, streamUrl: string) {
  return contentType.includes("mpegurl") || contentType.includes("x-mpegurl") || /\.m3u8?(\?|$)/i.test(streamUrl);
}

function proxyUrl(absoluteUrl: string, origin: string) {
  return `${origin}/api/hls-proxy?url=${encodeURIComponent(absoluteUrl)}`;
}

function rewriteM3u8Playlist(body: string, sourceUrl: string, origin: string) {
  return body
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      if (trimmed.startsWith("#EXT-X-KEY") || trimmed.startsWith("#EXT-X-MAP")) {
        return line.replace(/URI="([^"]+)"/g, (_match, uri) => {
          const absolute = new URL(uri, sourceUrl).toString();
          return `URI="${proxyUrl(absolute, origin)}"`;
        });
      }

      if (trimmed.startsWith("#")) return line;

      const absolute = new URL(trimmed, sourceUrl).toString();
      return proxyUrl(absolute, origin);
    })
    .join("\n");
}

function withStallTimeout(body: ReadableStream<Uint8Array> | null) {
  if (!body) return null;

  const reader = body.getReader();
  let timer: ReturnType<typeof setTimeout> | null = null;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      const resetTimer = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          try {
            controller.error(new Error("Upstream stream stalled"));
            reader.cancel().catch(() => {});
          } catch {}
        }, STALL_TIMEOUT_MS);
      };

      const pump = async () => {
        resetTimer();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              resetTimer();
              controller.enqueue(value);
            }
          }
          if (timer) clearTimeout(timer);
          controller.close();
        } catch (error) {
          if (timer) clearTimeout(timer);
          controller.error(error);
        }
      };

      pump();
    },
    cancel() {
      if (timer) clearTimeout(timer);
      return reader.cancel();
    },
  });
}

function mediaHeaders(upstream: Response, contentTypeOverride?: string, isLive = false) {
  const responseHeaders = new Headers();
  for (const h of [
    "content-type",
    "accept-ranges",
    "content-range",
    "cache-control",
  ]) {
    const v = upstream.headers.get(h);
    if (v) responseHeaders.set(h, v);
  }
  // Do NOT forward content-length for live streams — body is unbounded / chunked
  if (!isLive) {
    const cl = upstream.headers.get("content-length");
    if (cl) responseHeaders.set("content-length", cl);
  }
  if (contentTypeOverride) responseHeaders.set("content-type", contentTypeOverride);
  responseHeaders.set("access-control-allow-origin", "*");
  responseHeaders.set("x-content-type-options", "nosniff");
  // Prevent nginx/proxy buffering — required for live streams
  responseHeaders.set("x-accel-buffering", "no");
  return responseHeaders;
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
  if (!Number.isFinite(numericId) || numericId <= 0 || !Number.isInteger(numericId)) {
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
        const epObj =
          seasonEpisodes.find((e) => e.episode_num == episode || e.info?.episode == episode) ||
          seasonEpisodes[Number(episode) - 1];

        streamUrl = epObj
          ? await resolveStreamUrl("series", epObj.id, epObj.container_extension || "mp4")
          : await resolveStreamUrl("series", numericId, "mp4");
      } catch (e) {
        console.error("Failed to fetch series info", e);
        streamUrl = await resolveStreamUrl("series", numericId, "mp4");
      }
    } else {
      streamUrl = await resolveStreamUrl(type as StreamType, numericId);
    }

    const range = request.headers.get("range");
    const headers: Record<string, string> = { ...UPSTREAM_HEADERS } as Record<string, string>;
    if (range) headers.Range = range;

    const upstream = await fetchWithFallback(streamUrl, headers);
    const contentType = upstream.headers.get("content-type") ?? "";

    if (!upstream.ok && upstream.status !== 206) {
      let upstreamDetail = "";
      try {
        upstreamDetail = await upstream.text();
      } catch { /* ignore */ }
      console.error(`Upstream ${upstream.status} for ${streamUrl}:`, upstreamDetail.slice(0, 500));
      return NextResponse.json(
        { error: `הזרם אינו זמין כעת (upstream ${upstream.status})`, detail: upstreamDetail.slice(0, 200) },
        { status: upstream.status },
      );
    }

    // Force video/mp2t for MPEG-TS segments (.ts URLs or octet-stream that look like TS)
    const isTsSegment =
      /\.ts(\?|$)/i.test(streamUrl) ||
      contentType.includes("mp2t") ||
      contentType.includes("mpeg2");

    if (isM3u8(contentType, streamUrl)) {
      const text = await upstream.text();
      if (!text.includes("#EXTM3U")) {
        return NextResponse.json({ error: "פלייליסט HLS לא תקין" }, { status: 503 });
      }
      const rewritten = rewriteM3u8Playlist(text, streamUrl, url.origin);
      return new NextResponse(rewritten, {
        status: 200,
        headers: mediaHeaders(upstream, "application/vnd.apple.mpegurl; charset=utf-8"),
      });
    }

    const isMediaContent =
      contentType.startsWith("video/") ||
      contentType.startsWith("audio/") ||
      contentType.includes("octet-stream") ||
      contentType.includes("mp2t");

    if (!isMediaContent) {
      const text = await upstream.text();
      if (text.includes("FORCED_COUNTRY_INVALID") || text.includes("Country does not match")) {
        return NextResponse.json({ error: "הצפייה מוגבלת למיקום גיאוגרפי מסוים (Geo-Blocked)" }, { status: 403 });
      }
      return NextResponse.json({ error: "הזרם אינו זמין כעת" }, { status: 503 });
    }

    const isLiveStream = type === "live";
    const tsTypeOverride = isTsSegment && !isM3u8(contentType, streamUrl) ? "video/mp2t" : undefined;

    return new NextResponse(withStallTimeout(upstream.body), {
      status: upstream.status,
      headers: mediaHeaders(upstream, tsTypeOverride, isLiveStream),
    });
  } catch (error) {
    console.error(`/api/stream/${type}/${id} error`, error);
    return NextResponse.json({ error: "שגיאה בהפעלת הזרם" }, { status: 500 });
  }
}

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
