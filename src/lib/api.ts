import type {
  Category,
  EpgResponse,
  LiveResponse,
  SeriesResponse,
  VodResponse,
} from "@/types/content";

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`שגיאה בטעינת הנתונים (${res.status})`);
  }
  return res.json() as Promise<T>;
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
