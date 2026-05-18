interface HlsStreamState {
  key: string;
  upstreamUrl: string;
  segments: Map<number, Buffer>;
  current: Buffer[];
  currentSize: number;
  nextId: number;
  started: boolean;
  error?: string;
  lastAccess: number;
  abort?: AbortController;
}

const streams = new Map<string, HlsStreamState>();
const TARGET_BYTES = 384 * 1024;
const FIRST_TARGET_BYTES = 96 * 1024;
const MAX_SEGMENTS = 8;
const STREAM_TTL_MS = 10 * 60 * 1000;

function cleanup() {
  const now = Date.now();
  for (const [key, s] of streams) {
    if (now - s.lastAccess > STREAM_TTL_MS) {
      s.abort?.abort();
      streams.delete(key);
    }
  }
}
if (typeof setInterval !== "undefined") setInterval(cleanup, 60_000);

function finalizeSegment(s: HlsStreamState) {
  if (!s.currentSize) return;
  const data = Buffer.concat(s.current, s.currentSize);
  s.segments.set(s.nextId++, data);
  s.current = [];
  s.currentSize = 0;
  while (s.segments.size > MAX_SEGMENTS) {
    const first = Math.min(...s.segments.keys());
    s.segments.delete(first);
  }
}

async function pump(s: HlsStreamState) {
  if (s.started) return;
  s.started = true;
  const controller = new AbortController();
  s.abort = controller;
  try {
    const res = await fetch(s.upstreamUrl, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent": "VLC/3.0.21 LibVLC/3.0.21",
        Accept: "*/*",
      },
    });
    if (!res.ok || !res.body) {
      s.error = `upstream ${res.status}`;
      return;
    }
    const reader = res.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      const b = Buffer.from(value);
      s.current.push(b);
      s.currentSize += b.length;
      const target = s.nextId === 0 ? FIRST_TARGET_BYTES : TARGET_BYTES;
      if (s.currentSize >= target) finalizeSegment(s);
    }
    finalizeSegment(s);
  } catch (e) {
    if (!controller.signal.aborted) s.error = e instanceof Error ? e.message : "stream failed";
  }
}

export function startHlsStream(key: string, upstreamUrl: string) {
  let s = streams.get(key);
  if (!s || s.upstreamUrl !== upstreamUrl || s.error) {
    s?.abort?.abort();
    s = {
      key,
      upstreamUrl,
      segments: new Map(),
      current: [],
      currentSize: 0,
      nextId: 0,
      started: false,
      lastAccess: Date.now(),
    };
    streams.set(key, s);
  }
  s.lastAccess = Date.now();
  void pump(s);
  return s;
}

export function getPlaylist(key: string, origin: string) {
  const s = streams.get(key);
  if (!s) return null;
  s.lastAccess = Date.now();
  const ids = [...s.segments.keys()].sort((a, b) => a - b);
  if (!ids.length) return null;
  const first = ids[0];
  const lines = [
    "#EXTM3U",
    "#EXT-X-VERSION:3",
    "#EXT-X-TARGETDURATION:2",
    `#EXT-X-MEDIA-SEQUENCE:${first}`,
  ];
  for (const id of ids.slice(-5)) {
    lines.push("#EXTINF:2.0,");
    lines.push(`${origin}/api/ios-hls-seg/${encodeURIComponent(key)}/${id}.ts`);
  }
  return lines.join("\n") + "\n";
}

export function getSegment(key: string, seg: number) {
  const s = streams.get(key);
  if (!s) return null;
  s.lastAccess = Date.now();
  return s.segments.get(seg) ?? null;
}
