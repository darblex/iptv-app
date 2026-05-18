import type {
  Category,
  EpgResponse,
  LiveResponse,
  SeriesResponse,
  VodResponse,
} from "@/types/content";

const DEFAULT_TIMEOUT_MS = 12000;
const MAX_RETRIES = 2;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetcher = async <T>(url: string, attempt = 0): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const retryable = res.status === 408 || res.status === 425 || res.status === 429 || res.status >= 500;
      if (retryable && attempt < MAX_RETRIES) {
        await sleep(500 * (attempt + 1));
        return fetcher<T>(url, attempt + 1);
      }
      throw new Error(`שגיאה בטעינת הנתונים (${res.status})`);
    }

    return res.json() as Promise<T>;
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      await sleep(500 * (attempt + 1));
      return fetcher<T>(url, attempt + 1);
    }
    throw error instanceof Error ? error : new Error("שגיאה בטעינת הנתונים");
  } finally {
    clearTimeout(timeout);
  }
};

export const getLive = () => fetcher<LiveResponse>("/api/live");
export const getVod = () => fetcher<VodResponse>("/api/vod");
export const getSeries = () => fetcher<SeriesResponse>("/api/series");
export const getEpg = (channelId: number | string) =>
  fetcher<EpgResponse>(`/api/epg/${channelId}`);

// ── Account lease (client-side) ──────────────────────────────────────────────

const LEASE_TOKEN_KEY = "iptv-lease-token";
const LEASE_EXP_KEY = "iptv-lease-exp";
const LEASE_REFRESH_BEFORE_MS = 5 * 60 * 1000; // refresh 5min before expiry

export interface LeaseResult {
  token: string;
  username: string;
  password: string;
  host: string;
  port: number;
  proto: string;
  baseUrl: string;
}

/** Get or renew the account lease for this browser session. */
export async function getOrRenewLease(): Promise<LeaseResult> {
  if (typeof window === "undefined") throw new Error("client only");

  const stored = localStorage.getItem(LEASE_TOKEN_KEY);
  const exp = Number(localStorage.getItem(LEASE_EXP_KEY) ?? 0);
  const needsRefresh = !stored || Date.now() > exp - LEASE_REFRESH_BEFORE_MS;

  const url = needsRefresh && stored
    ? `/api/accounts/lease?token=${stored}`
    : stored && Date.now() < exp
    ? `/api/accounts/lease?token=${stored}`
    : "/api/accounts/lease";

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("אין חשבון פנוי — נסה שוב מאוחר יותר");
  const data = await res.json() as LeaseResult & { ttlMs: number };

  localStorage.setItem(LEASE_TOKEN_KEY, data.token);
  localStorage.setItem(LEASE_EXP_KEY, String(Date.now() + (data.ttlMs ?? 30 * 60 * 1000)));

  return data;
}

/** Build a direct stream URL for this browser session's account. */
export async function getDirectStreamUrl(
  type: "live" | "vod" | "series",
  id: number,
  extra?: { ext?: string; season?: string; episode?: string }
): Promise<string> {
  const lease = await getOrRenewLease();
  let url = `/api/stream-url/${type}/${id}?token=${lease.token}`;
  if (extra?.ext) url += `&ext=${extra.ext}`;
  if (extra?.season) url += `&season=${extra.season}`;
  if (extra?.episode) url += `&episode=${extra.episode}`;
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json() as { url?: string; error?: string };
  if (!data.url) throw new Error(data.error ?? "שגיאה בשליפת הזרם");
  return data.url;
}

export const normalizeCategories = (categories: Category[]) =>
  categories
    .slice()
    .sort((a, b) => a.category_name.localeCompare(b.category_name, "he"));
