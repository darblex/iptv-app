"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FeaturedBanner from "@/components/featured-banner";
import SearchBar from "@/components/search-bar";
import CategoryBar from "@/components/category-bar";
import ChannelCard from "@/components/channel-card";
import MovieCard from "@/components/movie-card";
import { CardSkeleton, PosterSkeleton } from "@/components/skeletons";
import { getLive, getVod } from "@/lib/api";
import { useFavorites } from "@/lib/hooks/use-favorites";
import type { FeaturedItem, LiveResponse, VodResponse } from "@/types/content";

export default function HomePage() {
  const router = useRouter();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [liveData, setLiveData] = useState<LiveResponse | null>(null);
  const [vodData, setVodData] = useState<VodResponse | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [live, vod] = await Promise.all([getLive(), getVod()]);
        setLiveData(live);
        setVodData(vod);
      } catch {
        setError("שגיאה בטעינת התוכן. נסו שוב בעוד רגע.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const featured: FeaturedItem[] = useMemo(() => {
    if (!vodData) return [];
    return (vodData.streams || [])
      .slice(0, 5)
      .map((m) => ({
        id: m.stream_id,
        type: "vod" as const,
        title: m.name,
        description: m.plot || "חוויית צפייה איכותית ב-4K",
        image: m.stream_icon || m.cover,
        tag: "VOD פרימיום",
      }));
  }, [vodData]);

  const filteredChannels = useMemo(() => {
    if (!liveData) return [];
    const list = liveData.streams || [];
    if (!category) return list.slice(0, 12);
    return list.filter((c) => c.category_id === category).slice(0, 12);
  }, [liveData, category]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 lg:px-6 lg:py-10">
      <div className="flex flex-col gap-4">
        <SearchBar
          suggestions={
            (vodData?.streams || []).map((s) => ({
              id: s.stream_id,
              type: "vod" as const,
              title: s.name,
              subtitle: s.genre,
            }))
          }
          onSelect={(s) => router.push(`/watch/${s.type}/${s.id}`)}
        />
        {featured.length > 0 && <FeaturedBanner items={featured} />}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">ערוצים במגמה</h3>
          <button
            onClick={() => router.push("/live")}
            className="text-sm text-primary hover:text-white"
          >
            לכל הערוצים →
          </button>
        </div>
        {liveData && liveData.categories && (
          <CategoryBar
            categories={liveData.categories}
            active={category ?? undefined}
            onSelect={(c) => setCategory(c)}
            allLabel="כל הקטגוריות"
          />
        )}
        {error && <div className="rounded-xl bg-rose-500/10 px-4 py-3 text-rose-100">{error}</div>}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredChannels.map((channel) => (
              <ChannelCard
                key={channel.stream_id}
                channel={channel}
                isFavorite={isFavorite(channel.stream_id, "live")}
                onToggleFavorite={() =>
                  toggleFavorite({ id: channel.stream_id, type: "live", name: channel.name, poster: channel.stream_icon })
                }
                onClick={() => router.push(`/watch/live/${channel.stream_id}`)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">חם ב-VOD</h3>
          <button
            onClick={() => router.push("/movies")}
            className="text-sm text-primary hover:text-white"
          >
            עוד סרטים →
          </button>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <PosterSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {(vodData?.streams || []).slice(0, 10).map((movie) => (
              <MovieCard key={movie.stream_id} movie={movie} onClick={() => router.push(`/watch/vod/${movie.stream_id}`)} />
            ))}
          </div>
        )}
      </section>

      {favorites.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xl font-bold text-white">המשכים מהמקום האחרון</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {favorites.map((fav) => (
              <div key={`${fav.type}-${fav.id}`} className="rounded-2xl border border-white/5 bg-white/5 p-3 text-right">
                <p className="text-sm font-semibold text-white">{fav.name}</p>
                <p className="text-xs text-slate-400 mt-1">{fav.type === "live" ? "ערוץ" : fav.type === "vod" ? "סרט" : "סדרה"}</p>
                <button
                  onClick={() => router.push(`/watch/${fav.type}/${fav.id}`)}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-primary/80 px-3 py-2 text-xs font-semibold text-white hover:bg-primary"
                >
                  המשך צפייה
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
