import { NextResponse } from "next/server";
import { StreamType, getVodInfo, getSeriesInfo, getAccountsWithMaxConns } from "@/lib/xtream";
import { getLeaseAccount } from "@/lib/account-pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES: StreamType[] = ["live", "vod", "series"];

interface Params { type: string; id: string; }

function buildDirectUrl(
  host: string, port: number, proto: string,
  type: StreamType, username: string, password: string,
  id: number | string, ext: string
): string {
  const base = (proto === "http" && port === 80) || (proto === "https" && port === 443)
    ? `${proto}://${host}`
    : `${proto}://${host}:${port}`;
  const prefix = type === "vod" ? "movie/" : type === "series" ? "series/" : "live/";
  return `${base}/${prefix}${username}/${password}/${id}.${ext}`;
}

/**
 * Returns the direct upstream stream URL so the client can connect
 * from their own IP. Pass ?token=<lease_token> to use a specific account.
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

  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  // Resolve which account to use
  const { accounts } = getAccountsWithMaxConns();
  let account = accounts[0]; // fallback to first

  if (token) {
    const leased = getLeaseAccount(token, accounts);
    if (leased) account = leased.account;
  }

  const proto = account.https ? "https" : "http";

  try {
    let streamUrl = "";

    if (type === "vod") {
      let ext = url.searchParams.get("ext");
      if (!ext) {
        try { const info = await getVodInfo(numericId); ext = info.movie_data?.container_extension ?? null; } catch { /* ignore */ }
      }
      streamUrl = buildDirectUrl(account.host, account.port, proto, "vod", account.username, account.password, numericId, ext || "mp4");
    } else if (type === "series") {
      const season = url.searchParams.get("season") || "1";
      const episode = url.searchParams.get("episode") || "1";
      try {
        const info = await getSeriesInfo(numericId);
        const ep = (info.episodes?.[season] || [])[Number(episode) - 1];
        const epId = ep ? ep.id : numericId;
        const epExt = ep?.container_extension || "mp4";
        streamUrl = buildDirectUrl(account.host, account.port, proto, "series", account.username, account.password, epId, epExt);
      } catch {
        streamUrl = buildDirectUrl(account.host, account.port, proto, "series", account.username, account.password, numericId, "mp4");
      }
    } else {
      streamUrl = buildDirectUrl(account.host, account.port, proto, "live", account.username, account.password, numericId, "ts");
    }

    return NextResponse.json({ url: streamUrl }, {
      headers: { "access-control-allow-origin": "*", "cache-control": "no-store" },
    });
  } catch (error) {
    console.error(`/api/stream-url/${type}/${id} error`, error);
    return NextResponse.json({ error: "שגיאה בשליפת כתובת הזרם" }, { status: 500 });
  }
}
