/**
 * account-pool.ts
 * Server-side session → IPTV account assignment.
 * Each browser gets a lease token → maps to one account.
 * Accounts are released after TTL of inactivity.
 */

import { XtreamAccount } from "./xtream";
import crypto from "crypto";

const LEASE_TTL_MS = 30 * 60 * 1000; // 30 min inactivity
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

interface Lease {
  accountIndex: number;
  lastSeen: number;
  createdAt: number;
}

// token → lease
const leases = new Map<string, Lease>();
// accountIndex → set of active tokens
const accountTokens = new Map<number, Set<string>>();

function generateToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

function getAccountTokens(idx: number): Set<string> {
  if (!accountTokens.has(idx)) accountTokens.set(idx, new Set());
  return accountTokens.get(idx)!;
}

function releaseLease(token: string) {
  const lease = leases.get(token);
  if (lease) {
    getAccountTokens(lease.accountIndex).delete(token);
    leases.delete(token);
  }
}

// Periodic cleanup of expired leases
function cleanup() {
  const now = Date.now();
  for (const [token, lease] of leases) {
    if (now - lease.lastSeen > LEASE_TTL_MS) {
      releaseLease(token);
    }
  }
}
// Only start interval in Node (not during build/edge)
if (typeof setInterval !== "undefined") {
  setInterval(cleanup, CLEANUP_INTERVAL_MS);
}

/**
 * Returns active slot count for an account index.
 * Uses in-memory active leases as a proxy.
 */
export function getActiveLeasesForAccount(idx: number): number {
  return getAccountTokens(idx).size;
}

/**
 * Assign the least-loaded account to this session.
 * Returns token + account index.
 * maxConnPerAccount: 0 = unlimited.
 */
export function leaseAccount(
  accounts: XtreamAccount[],
  maxConnPerAccount: number[],
  existingToken?: string
): { token: string; accountIndex: number; account: XtreamAccount } | null {
  if (!accounts.length) return null;

  // Refresh existing token if valid
  if (existingToken) {
    const lease = leases.get(existingToken);
    if (lease && Date.now() - lease.lastSeen < LEASE_TTL_MS) {
      lease.lastSeen = Date.now();
      return {
        token: existingToken,
        accountIndex: lease.accountIndex,
        account: accounts[lease.accountIndex],
      };
    }
    // expired — fall through to new lease
  }

  // Find account with free slot (fewest active leases, within max_connections)
  let bestIdx = -1;
  let bestLoad = Infinity;

  for (let i = 0; i < accounts.length; i++) {
    const active = getAccountTokens(i).size;
    const max = maxConnPerAccount[i] ?? 1;
    const hasSlot = max <= 0 || active < max;
    if (hasSlot && active < bestLoad) {
      bestLoad = active;
      bestIdx = i;
    }
  }

  if (bestIdx < 0) return null; // all full

  const token = generateToken();
  leases.set(token, {
    accountIndex: bestIdx,
    lastSeen: Date.now(),
    createdAt: Date.now(),
  });
  getAccountTokens(bestIdx).add(token);

  return {
    token,
    accountIndex: bestIdx,
    account: accounts[bestIdx],
  };
}

export function getLeaseAccount(
  token: string,
  accounts: XtreamAccount[]
): { account: XtreamAccount; accountIndex: number } | null {
  const lease = leases.get(token);
  if (!lease) return null;
  if (Date.now() - lease.lastSeen > LEASE_TTL_MS) {
    releaseLease(token);
    return null;
  }
  lease.lastSeen = Date.now();
  return { account: accounts[lease.accountIndex], accountIndex: lease.accountIndex };
}

export function revokeLease(token: string) {
  releaseLease(token);
}

export function getPoolStats(accounts: XtreamAccount[], maxConns: number[]) {
  return accounts.map((acc, i) => ({
    index: i,
    username: acc.username.slice(0, 4) + "***",
    host: acc.host,
    activeLeases: getAccountTokens(i).size,
    maxConns: maxConns[i] ?? 1,
    available: (maxConns[i] ?? 1) <= 0 || getAccountTokens(i).size < (maxConns[i] ?? 1),
  }));
}
