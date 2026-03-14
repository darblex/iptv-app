"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CategoryBar from "@/components/category-bar";
import MovieCard from "@/components/movie-card";
import SearchBar from "@/components/search-bar";
import { PosterSkeleton } from "@/components/skeletons";
import { getVod } from "@/lib/api";
import type { VodResponse, VodStream } from "@/types/content";
import { X } from "lucide-react";

export default function MoviesPage() {
  const router = useRouter();
  const [data, setData] = useState<VodResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<VodStream | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getVod();
        setData(res);
      } catch {
        setError("שגיאה בטעינת הספריה");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    return (data.streams || []).filter((movie) => {
      const matchesCategory = category ? movie.category_id === category : true;
      const matchesQuery = query ? movie.name.toLowerCase().includes(query.toLowerCase()) : true;
      return matchesCategory && matchesQuery;
    });
  }, [data, category, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-10">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-white">סרטים</h1>
        <SearchBar
          value={query}
          onChange={setQuery}
          suggestions={(data?.streams || []).map((s) => ({ id: s.stream_id, type: "vod" as const, title: s.name }))}
        />
        {data?.categories && (
          <CategoryBar
            categories={data.categories}
            active={category ?? undefined}
            onSelect={(c) => setCategory(c)}
            allLabel="כל הז'אנרים"
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
          {filtered.map((movie) => (
            <MovieCard key={movie.stream_id} movie={movie} onClick={() => setSelected(movie)} />
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f17] shadow-[0_30px_70px_rgba(0,0,0,0.45)]">
            <button
              onClick={() => setSelected(null)}
              className="absolute left-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="grid gap-0 md:grid-cols-[1fr_1.3fr]">
              <div
                className="aspect-video w-full bg-gradient-to-b from-[#1f1f2d] to-[#0b0b12]"
                style={{
                  backgroundImage: selected.stream_icon ? `url(${selected.stream_icon})` : selected.cover ? `url(${selected.cover})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="p-6 text-right">
                <p className="text-sm text-slate-400">VOD</p>
                <h3 className="text-2xl font-bold text-white">{selected.name}</h3>
                <p className="mt-3 text-sm text-slate-200 line-clamp-5">{selected.plot || "תקציר לא זמין"}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                  {selected.genre && <span className="rounded-full bg-white/5 px-3 py-1">{selected.genre}</span>}
                  {selected.rating && <span className="rounded-full bg-white/5 px-3 py-1">דירוג {selected.rating}</span>}
                  {selected.releasedate && <span className="rounded-full bg-white/5 px-3 py-1">{selected.releasedate.slice(0, 4)}</span>}
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => router.push(`/watch/vod/${selected.stream_id}`)}
                    className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_15px_40px_rgba(37,99,235,0.35)] hover:bg-primary/90"
                  >
                    צפו עכשיו
                  </button>
                  <button
                    onClick={() => setSelected(null)}
                    className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white hover:border-white/30"
                  >
                    סגור
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
