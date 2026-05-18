import { NextResponse } from "next/server";
import { getAccountsWithMaxConns } from "@/lib/xtream";
import { getLeaseAccount } from "@/lib/account-pool";
import { getPlaylist, startHlsStream } from "@/lib/hls-segmenter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function publicOrigin(request: Request) {
  const h = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const p = request.headers.get("x-forwarded-proto") || "https";
  return h ? `${p}://${h}` : new URL(request.url).origin;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const streamId = Number(id);
  if (!Number.isInteger(streamId) || streamId <= 0) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const { accounts } = getAccountsWithMaxConns();
  let account = accounts[0];
  if (token) {
    const leased = getLeaseAccount(token, accounts);
    if (leased) account = leased.account;
  }

  const relayBase = process.env.STREAM_RELAY_BASE;
  if (!relayBase) return NextResponse.json({ error: "missing relay" }, { status: 503 });

  const upstreamUrl = `${relayBase}/live/${account.username}/${account.password}/${streamId}.ts?_host=${encodeURIComponent(account.host)}&_port=${account.port}&_proto=${account.https ? "https" : "http"}`;
  const key = `${account.username}_${streamId}`;
  startHlsStream(key, upstreamUrl);

  const origin = publicOrigin(request);
  let playlist = getPlaylist(key, origin);
  if (!playlist) {
    // Wait briefly for first segment — keeps iPhone startup fast but reliable.
    const deadline = Date.now() + 3500;
    while (Date.now() < deadline && !playlist) {
      await new Promise((r) => setTimeout(r, 150));
      playlist = getPlaylist(key, origin);
    }
  }

  if (!playlist) {
    return NextResponse.json({ error: "stream warming up" }, { status: 503, headers: { "retry-after": "1" } });
  }

  return new NextResponse(playlist, {
    status: 200,
    headers: {
      "content-type": "application/vnd.apple.mpegurl; charset=utf-8",
      "cache-control": "no-cache, no-store",
      "access-control-allow-origin": "*",
      "x-accel-buffering": "no",
    },
  });
}
