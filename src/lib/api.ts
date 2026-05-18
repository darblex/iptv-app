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

export const normalizeCategories = (categories: Category[]) =>
  categories
    .slice()
    .sort((a, b) => a.category_name.localeCompare(b.category_name, "he"));
