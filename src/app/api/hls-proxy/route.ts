import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STALL_TIMEOUT_MS = 30_000;
const UPSTREAM_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "*/*",
  Connection: "keep-alive",
};

function publicOrigin(request: Request) {
  const headers = request.headers;
  const host = headers.get("x-forwarded-host") || headers.get("host");
  const proto = headers.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

function proxyUrl(absoluteUrl: string, origin: string) {
  return `${origin}/api/hls-proxy?url=${encodeURIComponent(absoluteUrl)}`;
}

function rewriteM3u8Playlist(body: string, sourceUrl: string, origin: string) {
  return body
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#EXT-X-PROGRAM-DATE-TIME")) return line;
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
      const reset = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          try {
            controller.error(new Error("HLS segment stalled"));
            reader.cancel().catch(() => {});
          } catch {}
        }, STALL_TIMEOUT_MS);
      };

      const pump = async () => {
        reset();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              reset();
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

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const target = requestUrl.searchParams.get("url");
  if (!target) return NextResponse.json({ error: "missing url" }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json({ error: "unsupported protocol" }, { status: 400 });
  }

  const headers: Record<string, string> = { ...UPSTREAM_HEADERS } as Record<string, string>;
  const range = request.headers.get("range");
  if (range) headers.Range = range;

  const upstream = await fetch(parsed.toString(), {
    headers,
    cache: "no-store",
    redirect: "follow",
  });

  if (!upstream.ok && upstream.status !== 206) {
    let detail = "";
    try { detail = await upstream.text(); } catch { /* ignore */ }
    console.error(`hls-proxy upstream ${upstream.status} for ${target}:`, detail.slice(0, 300));
    return NextResponse.json(
      { error: "segment unavailable", status: upstream.status, detail: detail.slice(0, 200) },
      { status: upstream.status },
    );
  }

  const upstreamContentType = upstream.headers.get("content-type") ?? "";
  // Force video/mp2t for .ts segments (some servers send octet-stream)
  const isTsSegment =
    /\.ts(\?|$)/i.test(target) ||
    upstreamContentType.includes("mp2t") ||
    upstreamContentType.includes("mpeg2");
  const isM3u8Segment =
    upstreamContentType.includes("mpegurl") ||
    upstreamContentType.includes("x-mpegurl") ||
    /\.m3u8?(\?|$)/i.test(target);

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
  // Don't forward content-length for live/chunked streams
  if (!isTsSegment) {
    const cl = upstream.headers.get("content-length");
    if (cl) responseHeaders.set("content-length", cl);
  }
  if (isTsSegment && !isM3u8Segment) {
    responseHeaders.set("content-type", "video/mp2t");
  }
  if (isM3u8Segment) {
    responseHeaders.set("content-type", "application/vnd.apple.mpegurl; charset=utf-8");
  }
  responseHeaders.set("access-control-allow-origin", "*");
  responseHeaders.set("x-content-type-options", "nosniff");
  // Prevent proxy buffering on live segments
  responseHeaders.set("x-accel-buffering", "no");

  if (isM3u8Segment) {
    const text = await upstream.text();
    const rewritten = rewriteM3u8Playlist(text, parsed.toString(), publicOrigin(request));
    responseHeaders.delete("content-length");
    return new NextResponse(rewritten, {
      status: upstream.status,
      headers: responseHeaders,
    });
  }

  return new NextResponse(withStallTimeout(upstream.body), {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export async function HEAD(request: Request) {
  const response = await GET(request);
  return new NextResponse(null, {
    status: response.status,
    headers: response.headers,
  });
}
