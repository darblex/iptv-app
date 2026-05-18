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
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/8 via-white/4 to-cyan-950/10 p-4 shadow-[0_15px_45px_rgba(0,0,0,0.25)] backdrop-blur transition hover:-translate-y-1 hover:border-cyan-300/40 hover:shadow-[0_20px_60px_rgba(0,200,240,0.22)]">
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
            <p className="live-pulse mt-1 inline-flex rounded-full bg-rose-500/18 px-2 py-0.5 text-[10px] font-bold text-rose-100 ring-1 ring-rose-400/30">LIVE</p>
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
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-cyan-400 to-purple-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01] hover:shadow-cyan-400/30"
      >
        <Play className="h-4 w-4" /> צפה עכשיו
      </button>
    </div>
  );
}
