import { NextResponse } from "next/server";
import { leaseAccount, revokeLease, getPoolStats } from "@/lib/account-pool";
import { getAccountsWithMaxConns } from "@/lib/xtream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const existingToken = url.searchParams.get("token") ?? undefined;

  const { accounts, maxConns } = getAccountsWithMaxConns();

  if (!accounts.length) {
    return NextResponse.json({ error: "אין חשבונות זמינים" }, { status: 503 });
  }

  const result = leaseAccount(accounts, maxConns, existingToken);

  if (!result) {
    return NextResponse.json(
      { error: "כל החשבונות תפוסים, נסה שוב בעוד רגע" },
      { status: 503 }
    );
  }

  const { account, token } = result;
  const proto = account.https ? "https" : "http";
  const baseUrl = account.port === 80 || account.port === 443
    ? `${proto}://${account.host}`
    : `${proto}://${account.host}:${account.port}`;

  return NextResponse.json({
    token,
    host: account.host,
    port: account.port,
    proto,
    baseUrl,
    username: account.username,
    password: account.password,
    ttlMs: 30 * 60 * 1000,
  }, {
    headers: {
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
    },
  });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (token) revokeLease(token);
  return NextResponse.json({ ok: true });
}

// Admin stats (no auth for now, only exposes masked usernames)
export async function HEAD() {
  const { accounts, maxConns } = getAccountsWithMaxConns();
  const stats = getPoolStats(accounts, maxConns);
  return NextResponse.json({ stats }, { headers: { "cache-control": "no-store" } });
}
