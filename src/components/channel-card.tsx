"use client";

import { Heart, Play } from "lucide-react";
import EPGStrip from "@/components/epg-strip";
import type { EpgEntry, LiveStream } from "@/types/content";
import { cn } from "@/lib/utils";

interface Props {
  channel: LiveStream;
  onClick?: () => void;
  now?: EpgEntry | null;
  next?: EpgEntry | null;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export default function ChannelCard({ channel, onClick, now, next, isFavorite, onToggleFavorite }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 via-white/3 to-transparent p-4 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_15px_50px_rgba(37,99,235,0.25)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="h-14 w-14 overflow-hidden rounded-xl bg-[#11111a] ring-1 ring-white/10"
            style={{
              backgroundImage: channel.stream_icon ? `url(${channel.stream_icon})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div>
            <p className="text-base font-semibold text-white">{channel.name}</p>
            <p className="text-xs text-slate-400">ערוץ חי</p>
          </div>
        </div>
        <button
          onClick={onToggleFavorite}
          aria-label="מועדף"
          className={cn(
            "rounded-full p-2 transition hover:bg-white/10",
            isFavorite ? "text-rose-400" : "text-slate-300"
          )}
        >
          <Heart className={cn("h-5 w-5", isFavorite && "fill-rose-500/30 stroke-rose-400")}/>
        </button>
      </div>

      <EPGStrip now={now} next={next} />

      <button
        onClick={onClick}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary/80 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary"
      >
        <Play className="h-4 w-4" /> צפה עכשיו
      </button>
    </div>
  );
}
