"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CategoryBar from "@/components/category-bar";
import ChannelCard from "@/components/channel-card";
import SearchBar from "@/components/search-bar";
import { CardSkeleton } from "@/components/skeletons";
import { getEpg, getLive } from "@/lib/api";
import { useFavorites } from "@/lib/hooks/use-favorites";
import type { EpgEntry, LiveResponse } from "@/types/content";

export default function LivePage() {
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [data, setData] = useState<LiveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [epgMap, setEpgMap] = useState<Record<number, { now: EpgEntry | null; next: EpgEntry | null }>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getLive();
        setData(res);
      } catch {
        setError("שגיאה בטעינת ערוצי הלייב");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isNow = useCallback((program: EpgEntry) => {
    const start = program.start_timestamp ?? program.start;
    const end = program.stop_timestamp ?? program.end;
    const nowTs = Date.now() / 1000;
    return !!start && !!end && start <= nowTs && nowTs <= end;
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    return (data.streams || []).filter((channel) => {
      const matchesCategory = category ? channel.category_id === category : true;
      const matchesQuery = query ? channel.name.toLowerCase().includes(query.toLowerCase()) : true;
      return matchesCategory && matchesQuery;
    });
  }, [data, category, query]);

  useEffect(() => {
    let stale = false;

    const loadEpg = async () => {
      const subset = filtered.slice(0, 15); // limit to reduce load
      const promises = subset.map(async (channel) => {
        try {
          const epg = await getEpg(channel.stream_id);
          const now = epg.nowPlaying ?? epg.epg.find((p) => isNow(p));
          const next = epg.epg.find((p) => {
            const start = p.start_timestamp ?? p.start;
            return start && start > Date.now() / 1000;
          });
          return { id: channel.stream_id, now: now ?? null, next: next ?? null };
        } catch {
          return { id: channel.stream_id, now: null, next: null };
        }
      });

      const results = await Promise.all(promises);
      if (!stale) {
        setEpgMap((prev) => {
          const updated = { ...prev };
          results.forEach((item) => {
            updated[item.id] = { now: item.now, next: item.next };
          });
          return updated;
        });
      }
    };

    if (filtered.length) {
      loadEpg();
    }

    return () => { stale = true; };
  }, [filtered, isNow]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-10">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-white">טלוויזיה חיה</h1>
        <SearchBar
          value={query}
          onChange={setQuery}
          suggestions={(data?.streams || []).map((s) => ({ id: s.stream_id, type: "live" as const, title: s.name }))}
        />
        {data?.categories && (
          <CategoryBar
            categories={data.categories}
            active={category ?? undefined}
            onSelect={(c) => setCategory(c)}
            allLabel="כל הערוצים"
          />
        )}
      </div>

      {error && <div className="mt-4 rounded-xl bg-rose-500/15 px-4 py-3 text-rose-100">{error}</div>}

      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((channel) => (
            <ChannelCard
              key={channel.stream_id}
              channel={channel}
              now={epgMap[channel.stream_id]?.now}
              next={epgMap[channel.stream_id]?.next}
              isFavorite={isFavorite(channel.stream_id, "live")}
              onToggleFavorite={() =>
                toggleFavorite({ id: channel.stream_id, type: "live", name: channel.name, poster: channel.stream_icon })
              }
              onClick={() => router.push(`/watch/live/${channel.stream_id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
