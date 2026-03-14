export type StreamType = "live" | "vod" | "series";

export interface Category {
  category_id: string;
  category_name: string;
  parent_id?: number;
}

export interface LiveStream {
  stream_id: number;
  name: string;
  category_id: string;
  stream_icon?: string | null;
  added?: string;
  tv_archive?: number;
  tv_archive_duration?: number;
}

export interface VodStream extends LiveStream {
  container_extension?: string;
  rating?: string;
  plot?: string;
  releasedate?: string;
  genre?: string;
  cover?: string;
  backdrop_path?: string;
  year?: string;
}

export interface SeriesItem {
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

export interface EpgEntry {
  id?: string;
  title: string;
  start?: number;
  end?: number;
  description?: string;
  start_timestamp?: number;
  stop_timestamp?: number;
  channel_id?: string;
}

export interface LiveResponse {
  categories: Category[];
  streams: LiveStream[];
}

export interface VodResponse {
  categories: Category[];
  streams: VodStream[];
}

export interface SeriesResponse {
  categories: Category[];
  series?: SeriesItem[];
  streams?: SeriesItem[];
}

export interface EpgResponse {
  epg: EpgEntry[];
  nowPlaying?: EpgEntry | null;
}

export interface FeaturedItem {
  id: number;
  type: StreamType;
  title: string;
  description?: string;
  image?: string | null;
  tag?: string;
}
