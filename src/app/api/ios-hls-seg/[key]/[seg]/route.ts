import { NextResponse } from "next/server";
import { getSegment } from "@/lib/hls-segmenter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ key: string; seg: string }> }) {
  const { key, seg } = await context.params;
  const segId = Number(seg.replace(/\.ts$/i, ""));
  if (!Number.isInteger(segId) || segId < 0) return new NextResponse("bad segment", { status: 400 });
  const data = getSegment(decodeURIComponent(key), segId);
  if (!data) return new NextResponse("segment not found", { status: 404, headers: { "access-control-allow-origin": "*" } });
  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      "content-type": "video/mp2t",
      "cache-control": "no-cache",
      "access-control-allow-origin": "*",
      "x-accel-buffering": "no",
    },
  });
}
