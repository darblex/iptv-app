"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/search-bar";
import { CardSkeleton, PosterSkeleton } from "@/components/skeletons";
import { getLive, getSeries, getVod } from "@/lib/api";
import type { LiveResponse, SeriesItem, SeriesResponse, VodResponse } from "@/types/content";

export default function SearchPage() {
  const router = useRouter();
  const [live, setLive] = useState<LiveResponse | null>(null);
  const [vod, setVod] = useState<VodResponse | null>(null);
  const [series, setSeries] = useState<SeriesResponse | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [l, v, s] = await Promise.all([getLive(), getVod(), getSeries()]);
        setLive(l);
        setVod(v);
        setSeries(s);
      } catch {
        // ignore errors individually for now
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const suggestions = useMemo(() => {
    const liveList = (live?.streams || []).map((item) => ({ id: item.stream_id, type: "live" as const, title: item.name }));
    const vodList = (vod?.streams || []).map((item) => ({ id: item.stream_id, type: "vod" as const, title: item.name }));
    const seriesList = ((series?.series || series?.streams || []) as SeriesItem[]).map((item) => ({ id: item.series_id, type: "series" as const, title: item.name }));
    return [...liveList, ...vodList, ...seriesList];
  }, [live, vod, series]);

  const filteredLive = useMemo(
    () => (live?.streams || []).filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [live, query]
  );
  const filteredVod = useMemo(
    () => (vod?.streams || []).filter((m) => m.name.toLowerCase().includes(query.toLowerCase())),
    [vod, query]
  );
  const filteredSeries = useMemo(
    () => ((series?.series || series?.streams || []) as SeriesItem[]).filter((s) => s.name.toLowerCase().includes(query.toLowerCase())),
    [series, query]
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-10">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-white">חיפוש</h1>
        <SearchBar
          value={query}
          onChange={setQuery}
          suggestions={suggestions}
          onSelect={(s) => router.push(`/watch/${s.type}/${s.id}`)}
        />
      </div>

      {loading ? (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <PosterSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">ערוצים חיים</h3>
            {filteredLive.length === 0 ? (
              <p className="text-sm text-slate-400">אין תוצאות תואמות.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredLive.slice(0, 9).map((channel) => (
                  <div
                    key={channel.stream_id}
                    className="cursor-pointer rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-right text-white transition hover:border-primary/50"
                    onClick={() => router.push(`/watch/live/${channel.stream_id}`)}
                  >
                    <p className="text-lg font-semibold">{channel.name}</p>
                    <p className="text-xs text-slate-400">לחצו לצפייה</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">סרטים</h3>
            {filteredVod.length === 0 ? (
              <p className="text-sm text-slate-400">אין תוצאות תואמות.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredVod.slice(0, 12).map((movie) => (
                  <button
                    key={movie.stream_id}
                    onClick={() => router.push(`/watch/vod/${movie.stream_id}`)}
                    className="overflow-hidden rounded-2xl border border-white/5 bg-white/5 text-right text-white transition hover:border-primary/50"
                  >
                    <div
                      className="aspect-[2/3] w-full"
                      style={{
                        backgroundImage: movie.stream_icon ? `url(${movie.stream_icon})` : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-semibold">{movie.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">סדרות</h3>
            {filteredSeries.length === 0 ? (
              <p className="text-sm text-slate-400">אין תוצאות תואמות.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredSeries.slice(0, 12).map((item) => (
                  <button
                    key={item.series_id}
                    onClick={() => router.push(`/watch/series/${item.series_id}`)}
                    className="overflow-hidden rounded-2xl border border-white/5 bg-white/5 text-right text-white transition hover:border-primary/50"
                  >
                    <div
                      className="aspect-[2/3] w-full"
                      style={{
                        backgroundImage: item.cover ? `url(${item.cover})` : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-semibold">{item.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
