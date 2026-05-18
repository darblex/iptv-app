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
    return NextResponse.json({ error: "segment unavailable" }, { status: upstream.status });
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
  responseHeaders.set("access-control-allow-origin", "*");
  responseHeaders.set("x-content-type-options", "nosniff");

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
