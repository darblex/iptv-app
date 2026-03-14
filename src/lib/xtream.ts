export type StreamType = "live" | "vod" | "series";

export interface XtreamAccount {
  host: string;
  port: number;
  username: string;
  password: string;
  https?: boolean;
}

interface AccountState extends XtreamAccount {
  healthy: boolean;
  lastChecked: number;
}

export interface XtreamCategory {
  category_id: string;
  category_name: string;
  parent_id?: number;
}

export interface XtreamStream {
  stream_id: number;
  name: string;
  category_id: string;
  stream_icon?: string | null;
  added?: string;
  custom_sid?: string;
  direct_source?: string;
  tv_archive?: number;
  tv_archive_duration?: number;
}

export interface XtreamVodStream extends XtreamStream {
  container_extension?: string;
  rating?: string;
  plot?: string;
  releasedate?: string;
}

export interface XtreamSeries {
  series_id: number;
  name: string;
  cover?: string;
  plot?: string;
  cast?: string;
  director?: string;
  genre?: string;
  rating?: string;
  releaseDate?: string;
  category_id?: string;
}

export interface XtreamEpgEntry {
  id: string;
  title: string;
  start: number;
  end: number;
  description?: string;
  start_timestamp?: number;
  stop_timestamp?: number;
  channel_id?: string;
}

export interface LiveResponse {
  categories: XtreamCategory[];
  streams: XtreamStream[];
}

export interface VodResponse {
  categories: XtreamCategory[];
  streams: XtreamVodStream[];
}

export interface SeriesResponse {
  categories: XtreamCategory[];
  series: XtreamSeries[];
}

export interface EpgResponse {
  epg: XtreamEpgEntry[];
  nowPlaying?: XtreamEpgEntry | null;
}

const HEALTH_CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;
const accounts: AccountState[] = loadAccounts();
let roundRobinIndex = 0;

function assertAccounts(): void {
  if (!accounts.length) {
    throw new Error("לא נמצאו חשבונות IPTV מוגדרים בסביבת ההפעלה");
  }
}

function loadAccounts(): AccountState[] {
  const accountsFromEnv: XtreamAccount[] = [];
  const envAccounts = process.env.IPTV_ACCOUNTS;

  if (envAccounts) {
    try {
      const parsed = JSON.parse(envAccounts) as XtreamAccount[];
      parsed.forEach((account) => {
        if (account.host && account.port && account.username && account.password) {
          accountsFromEnv.push(normalizeAccount(account));
        }
      });
    } catch (error) {
      console.error("Failed to parse IPTV_ACCOUNTS", error);
    }
  }

  const singleAccount =
    process.env.IPTV_HOST &&
    process.env.IPTV_PORT &&
    process.env.IPTV_USER &&
    process.env.IPTV_PASS
      ? {
          host: process.env.IPTV_HOST,
          port: Number(process.env.IPTV_PORT),
          username: process.env.IPTV_USER,
          password: process.env.IPTV_PASS,
        }
      : null;

  if (singleAccount) {
    accountsFromEnv.push(normalizeAccount(singleAccount));
  }

  return accountsFromEnv.map((account) => ({
    ...account,
    healthy: false,
    lastChecked: 0,
  }));
}

function normalizeAccount(account: XtreamAccount): XtreamAccount {
  const port = Number(account.port) || 80;
  const https = account.https ?? port === 443;

  return {
    host: account.host.trim(),
    port,
    username: account.username,
    password: account.password,
    https,
  };
}

function getProtocol(account: XtreamAccount): "http" | "https" {
  return account.https === false ? "http" : "https";
}

function buildBaseUrl(account: XtreamAccount): string {
  const protocol = getProtocol(account);
  return `${protocol}://${account.host}:${account.port}`;
}

async function checkHealth(account: AccountState): Promise<boolean> {
  const now = Date.now();
  if (account.healthy && now - account.lastChecked < HEALTH_CACHE_TTL_MS) {
    return true;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const search = new URLSearchParams({
      username: account.username,
      password: account.password,
      action: "get_live_categories",
    });
    const url = `${buildBaseUrl(account)}/player_api.php?${search.toString()}`;
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
    account.healthy = res.ok;
    account.lastChecked = now;
    return res.ok;
  } catch (error) {
    account.healthy = false;
    account.lastChecked = now;
    console.error("IPTV health check failed", error);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function pickAccount(): Promise<AccountState> {
  assertAccounts();

  for (let i = 0; i < accounts.length; i++) {
    const idx = (roundRobinIndex + i) % accounts.length;
    const account = accounts[idx];
    const healthy = await checkHealth(account);
    if (healthy) {
      roundRobinIndex = (idx + 1) % accounts.length;
      return account;
    }
  }

  throw new Error("אין חשבון IPTV זמין כרגע. נסו שוב בעוד רגע.");
}

class XtreamClient {
  constructor(private account: XtreamAccount) {}

  private buildUrl(params: Record<string, string | number | undefined>): string {
    const search = new URLSearchParams({
      username: this.account.username,
      password: this.account.password,
    });

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        search.append(key, String(value));
      }
    });

    return `${buildBaseUrl(this.account)}/player_api.php?${search.toString()}`;
  }

  private async fetchApi<T>(params: Record<string, string | number>): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const url = this.buildUrl(params);
      const res = await fetch(url, {
        cache: "no-store",
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Xtream API error: ${res.status}`);
      }

      return (await res.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  async getLiveCategories(): Promise<XtreamCategory[]> {
    return this.fetchApi<XtreamCategory[]>({ action: "get_live_categories" });
  }

  async getLiveStreams(): Promise<XtreamStream[]> {
    return this.fetchApi<XtreamStream[]>({ action: "get_live_streams" });
  }

  async getVodCategories(): Promise<XtreamCategory[]> {
    return this.fetchApi<XtreamCategory[]>({ action: "get_vod_categories" });
  }

  async getVodStreams(): Promise<XtreamVodStream[]> {
    return this.fetchApi<XtreamVodStream[]>({ action: "get_vod_streams" });
  }

  async getSeriesCategories(): Promise<XtreamCategory[]> {
    return this.fetchApi<XtreamCategory[]>({ action: "get_series_categories" });
  }

  async getSeries(): Promise<XtreamSeries[]> {
    return this.fetchApi<XtreamSeries[]>({ action: "get_series" });
  }

  async getShortEpg(streamId: number): Promise<{ epg_listings: XtreamEpgEntry[] }> {
    return this.fetchApi<{ epg_listings: XtreamEpgEntry[] }>({
      action: "get_short_epg",
      stream_id: streamId,
    });
  }

  async getSimpleDataTable(streamId: number): Promise<{ epg_listings: XtreamEpgEntry[] }> {
    return this.fetchApi<{ epg_listings: XtreamEpgEntry[] }>({
      action: "get_simple_data_table",
      stream_id: streamId,
    });
  }

  buildStreamUrl(type: StreamType, id: number | string): string {
    const extension = type === "live" ? "ts" : "mp4";
    return `${buildBaseUrl(this.account)}/${this.account.username}/${this.account.password}/${id}.${extension}`;
  }
}

async function getClient(): Promise<XtreamClient> {
  const account = await pickAccount();
  return new XtreamClient(account);
}

export async function getLive(): Promise<LiveResponse> {
  const client = await getClient();
  const [categories, streams] = await Promise.all([
    client.getLiveCategories(),
    client.getLiveStreams(),
  ]);

  return { categories, streams };
}

export async function getVod(): Promise<VodResponse> {
  const client = await getClient();
  const [categories, streams] = await Promise.all([
    client.getVodCategories(),
    client.getVodStreams(),
  ]);

  return { categories, streams };
}

export async function getSeriesData(): Promise<SeriesResponse> {
  const client = await getClient();
  const [categories, series] = await Promise.all([
    client.getSeriesCategories(),
    client.getSeries(),
  ]);

  return { categories, series };
}

export async function getEpg(streamId: number): Promise<EpgResponse> {
  const client = await getClient();
  const [short, table] = await Promise.all([
    client.getShortEpg(streamId),
    client.getSimpleDataTable(streamId),
  ]);

  const combined = [...(short.epg_listings || []), ...(table.epg_listings || [])];
  combined.sort((a, b) => (a.start || a.start_timestamp || 0) - (b.start || b.start_timestamp || 0));

  const now = Date.now() / 1000;
  const nowPlaying = combined.find((item) => {
    const start = item.start_timestamp ?? item.start;
    const end = item.stop_timestamp ?? item.end;
    return start !== undefined && end !== undefined && start <= now && now <= end;
  });

  return {
    epg: combined,
    nowPlaying: nowPlaying ?? null,
  };
}

export async function resolveStreamUrl(type: StreamType, id: number | string): Promise<string> {
  const client = await getClient();
  return client.buildStreamUrl(type, id);
}
