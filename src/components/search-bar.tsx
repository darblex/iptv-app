"use client";

import { useEffect, useMemo, useRef, useState, type ElementType } from "react";
import { Search, TvMinimalPlay, Clapperboard, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StreamType } from "@/types/content";

export interface Suggestion {
  id: number;
  type: StreamType;
  title: string;
  subtitle?: string;
}

interface Props {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  suggestions?: Suggestion[];
  onSelect?: (suggestion: Suggestion) => void;
}

const iconMap: Record<StreamType, ElementType> = {
  live: TvMinimalPlay,
  vod: Clapperboard,
  series: Library,
};

export default function SearchBar({ placeholder = "חפשו ערוץ, סרט או סדרה", value = "", onChange, suggestions = [], onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    if (!value) return suggestions.slice(0, 6);
    return suggestions
      .filter((s) => s.title.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 8);
  }, [value, suggestions]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white ring-primary/40 transition focus-within:border-primary/50 focus-within:shadow-[0_15px_45px_rgba(37,99,235,0.25)]">
        <Search className="h-4 w-4 text-slate-300" />
        <input
          value={value}
          onChange={(e) => {
            onChange?.(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-right outline-none placeholder:text-slate-500"
        />
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute inset-x-0 top-[110%] z-30 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d14] shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          {filtered.map((s) => {
            const Icon = iconMap[s.type];
            return (
              <button
                key={`${s.type}-${s.id}`}
                onClick={() => {
                  onSelect?.(s);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-right text-sm text-slate-100 transition",
                  "hover:bg-white/5"
                )}
              >
                <Icon className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <p className="font-semibold">{s.title}</p>
                  {s.subtitle && <p className="text-xs text-slate-400">{s.subtitle}</p>}
                </div>
                <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] text-slate-300">
                  {s.type === "live" ? "לייב" : s.type === "vod" ? "סרט" : "סדרה"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
