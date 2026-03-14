"use client";

import { Suspense, useEffect, useState } from "react";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import VideoPlayer from "@/components/video-player";
import { getEpg, getLive, getSeries, getVod } from "@/lib/api";
import type { EpgEntry, SeriesItem, StreamType } from "@/types/content";

import { use } from "react";

interface Props {
  params: Promise<{ type: string; id: string }>;
}

function WatchContent({ params: paramsPromise }: Props) {
  const params = use(paramsPromise);
  const router = useRouter();
  const searchParams = useSearchParams();
  const streamId = Number(params.id);
  const type = params.type as StreamType;
  const isValidType = type === "live" || type === "vod" || type === "series";

  const [title, setTitle] = useState<string>("טוען...");
  const [description, setDescription] = useState<string>("");
  const [poster, setPoster] = useState<string | undefined>(undefined);
  const [now, setNow] = useState<EpgEntry | null>(null);
  const [next, setNext] = useState<EpgEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ext, setExt] = useState<string | null>(null);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        if (type === "live") {
          const data = await getLive();
          const channel = data.streams.find((c) => c.stream_id === streamId);
          setTitle(channel?.name || "ערוץ חי");
          setPoster(channel?.stream_icon || undefined);
          const epg = await getEpg(streamId);
          setNow(epg.nowPlaying ?? epg.epg.find((p) => isNow(p)) ?? null);
          const nextProgram = epg.epg.find((p) => {
            const start = p.start_timestamp ?? p.start;
            return start && start > Date.now() / 1000;
          });
          setNext(nextProgram ?? null);
        } else if (type === "vod") {
          const data = await getVod();
          const movie = data.streams.find((m) => m.stream_id === streamId);
          setTitle(movie?.name || "סרט");
          setDescription(movie?.plot || "");
          setPoster(movie?.stream_icon || movie?.cover || undefined);
          if (movie?.container_extension) setExt(movie.container_extension);
        } else if (type === "series") {
          const data = await getSeries();
          const seriesList = (data.series || (data.streams as SeriesItem[] | undefined) || []) as SeriesItem[];
          const series = seriesList.find((s) => s.series_id === streamId);
          setTitle(series?.name || "סדרה");
          setDescription(series?.plot || "");
          setPoster(series?.cover || undefined);
        }
      } catch {
        setError("שגיאה בטעינת הזרם");
      }
    };
    if (isValidType && streamId) {
      loadMeta();
    }
  }, [type, streamId, isValidType]);

  const isNow = (program: EpgEntry) => {
    const start = program.start_timestamp ?? program.start;
    const end = program.stop_timestamp ?? program.end;
    const nowTs = Date.now() / 1000;
    return !!start && !!end && start <= nowTs && nowTs <= end;
  };

  if (!streamId || Number.isNaN(streamId) || !isValidType) return notFound();

  const season = searchParams.get("season");
  const episode = searchParams.get("episode");
  const src = `/api/stream/${type}/${streamId}${type === 'vod' && ext ? `?ext=${ext}` : type === 'series' && (season || episode) ? `?season=${season || 1}&episode=${episode || 1}` : ''}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-10">
      {error && <div className="mb-4 rounded-xl bg-rose-500/15 px-4 py-3 text-rose-100">{error}</div>}
      <VideoPlayer src={src} type={type} title={title} poster={poster} />

      <div className="mt-6 rounded-3xl border border-white/5 bg-white/5 p-6 text-right text-white">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-slate-400">
            {type === "live" ? "שידור חי" : type === "vod" ? "וידאו לפי דרישה" : "סדרה"}
          </p>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && <p className="text-sm text-slate-200">{description}</p>}
          {type === "series" && (season || episode) && (
            <p className="text-xs text-slate-400">עונה {season || 1} · פרק {episode || 1}</p>
          )}
          {type === "live" && (
            <div className="mt-3 rounded-xl bg-black/30 p-4 text-sm">
              <p className="font-semibold text-emerald-300">עכשיו: {now?.title || "מתעדכן"}</p>
              <p className="text-slate-300">הבא: {next?.title || "בהמשך"}</p>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
            <button
              onClick={() => router.back()}
              className="rounded-full border border-white/10 px-3 py-1 hover:border-white/30"
            >
              חזרה
            </button>
            <button
              onClick={() => router.push("/")}
              className="rounded-full border border-white/10 px-3 py-1 hover:border-white/30"
            >
              לדף הבית
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WatchPage({ params: paramsPromise }: Props) {
  return (
    <Suspense fallback={null}>
      <WatchContent params={paramsPromise} />
    </Suspense>
  );
}
