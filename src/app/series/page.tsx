"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CategoryBar from "@/components/category-bar";
import SeriesCard from "@/components/series-card";
import SearchBar from "@/components/search-bar";
import { PosterSkeleton } from "@/components/skeletons";
import { getSeries } from "@/lib/api";
import type { SeriesItem, SeriesResponse } from "@/types/content";
import { X } from "lucide-react";

export default function SeriesPage() {
  const router = useRouter();
  const [data, setData] = useState<SeriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SeriesItem | null>(null);
  const [season, setSeason] = useState(1);

  useEffect(() => {
    if (selected) setSeason(1);
  }, [selected]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getSeries();
        setData(res);
      } catch {
        setError("שגיאה בטעינת ספריית הסדרות");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const list = useMemo(() => {
    if (!data) return [];
    const seriesList = data.series ?? (data.streams as SeriesItem[] | undefined) ?? [];
    return seriesList.filter((item) => {
      const matchesCategory = category ? item.category_id === category : true;
      const matchesQuery = query ? item.name.toLowerCase().includes(query.toLowerCase()) : true;
      return matchesCategory && matchesQuery;
    });
  }, [data, category, query]);

  const renderEpisodes = () => {
    if (!selected) return [];
    return Array.from({ length: 8 }).map((_, idx) => ({
      title: `עונה ${season} · פרק ${idx + 1}`,
      description: selected.plot || "פרק חדש בסדרה",
    }));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-10">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-white">סדרות</h1>
        <SearchBar
          value={query}
          onChange={setQuery}
          suggestions={list.map((s) => ({ id: s.series_id, type: "series" as const, title: s.name }))}
        />
        {data?.categories && (
          <CategoryBar
            categories={data.categories}
            active={category ?? undefined}
            onSelect={(c) => setCategory(c)}
            allLabel="כל הסדרות"
          />
        )}
      </div>

      {error && <div className="mt-4 rounded-xl bg-rose-500/15 px-4 py-3 text-rose-100">{error}</div>}

      {loading ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <PosterSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {list.map((series) => (
            <SeriesCard key={series.series_id} series={series} onClick={() => setSelected(series)} />
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f17] shadow-[0_30px_70px_rgba(0,0,0,0.45)]">
            <button
              onClick={() => setSelected(null)}
              className="absolute left-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="grid gap-0 md:grid-cols-[1fr_1.2fr]">
              <div
                className="aspect-video w-full bg-gradient-to-b from-[#1f1f2d] to-[#0b0b12]"
                style={{
                  backgroundImage: selected.cover ? `url(${selected.cover})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="p-6 text-right">
                <p className="text-sm text-slate-400">סדרה</p>
                <h3 className="text-2xl font-bold text-white">{selected.name}</h3>
                <p className="mt-3 text-sm text-slate-200 line-clamp-5">{selected.plot || "אין תקציר זמין"}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                  {selected.genre && <span className="rounded-full bg-white/5 px-3 py-1">{selected.genre}</span>}
                  {selected.rating && <span className="rounded-full bg-white/5 px-3 py-1">דירוג {selected.rating}</span>}
                  {selected.releaseDate && <span className="rounded-full bg-white/5 px-3 py-1">{selected.releaseDate}</span>}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSeason(i + 1)}
                      className={`rounded-full px-3 py-1 text-xs ${season === i + 1 ? "bg-primary text-white" : "bg-white/5 text-slate-200"}`}
                    >
                      עונה {i + 1}
                    </button>
                  ))}
                </div>

                <div className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
                  {renderEpisodes().map((ep, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{ep.title}</p>
                        <p className="text-xs text-slate-300 line-clamp-2">{ep.description}</p>
                      </div>
                      <button
                        onClick={() => router.push(`/watch/series/${selected.series_id}?season=${season}&episode=${idx + 1}`)}
                        className="ml-3 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90"
                      >
                        צפה
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
