"use client";

import { Clapperboard } from "lucide-react";
import type { SeriesItem } from "@/types/content";

interface Props {
  series: SeriesItem;
  onClick?: () => void;
}

export default function SeriesCard({ series, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#11111a] transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_15px_50px_rgba(37,99,235,0.25)]"
    >
      <div
        className="aspect-[2/3] w-full bg-gradient-to-b from-[#1f1f2d] to-[#0b0b12]"
        style={{
          backgroundImage: series.cover ? `url(${series.cover})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3 text-right">
        <p className="line-clamp-2 text-sm font-semibold text-white">{series.name}</p>
        <div className="mt-1 flex items-center gap-2 text-xs text-slate-300">
          <Clapperboard className="h-3.5 w-3.5" />
          <span>{series.genre || "סדרה"}</span>
        </div>
      </div>
    </button>
  );
}
