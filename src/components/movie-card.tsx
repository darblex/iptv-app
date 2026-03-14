"use client";

import { Star } from "lucide-react";
import type { VodStream } from "@/types/content";

interface Props {
  movie: VodStream;
  onClick?: () => void;
}

export default function MovieCard({ movie, onClick }: Props) {
  const year = movie.releasedate?.slice(0, 4) || movie.year || "";
  return (
    <button
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#11111a] transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_15px_50px_rgba(37,99,235,0.25)]"
    >
      <div
        className="aspect-[2/3] w-full bg-gradient-to-b from-[#1f1f2d] to-[#0b0b12]"
        style={{
          backgroundImage: movie.stream_icon ? `url(${movie.stream_icon})` : movie.cover ? `url(${movie.cover})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3 text-right">
        <p className="line-clamp-2 text-sm font-semibold text-white">{movie.name}</p>
        <div className="mt-1 flex items-center justify-between text-xs text-slate-300">
          <span>{year}</span>
          {movie.rating && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-1 text-[11px]">
              <Star className="h-3 w-3 text-amber-300" /> {movie.rating}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
