"use client";

import { cn } from "@/lib/utils";
import type { Category } from "@/types/content";

interface Props {
  categories: Category[];
  active?: string;
  onSelect?: (categoryId: string | null) => void;
  allLabel?: string;
}

export default function CategoryBar({ categories, active, onSelect, allLabel = "הכל" }: Props) {
  return (
    <div className="relative mb-6">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary/60 scrollbar-track-transparent">
        <button
          onClick={() => onSelect?.(null)}
          className={cn(
            "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:border-cyan-300/40 hover:text-white",
            !active && "border-cyan-300/40 bg-gradient-to-l from-cyan-400/20 to-purple-500/20 text-white shadow-[0_10px_30px_rgba(0,200,240,0.22)]"
          )}
        >
          {allLabel}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.category_id}
            onClick={() => onSelect?.(cat.category_id)}
            className={cn(
              "rounded-full border border-white/5 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/40 hover:text-white",
              active === cat.category_id &&
                "border-cyan-300/50 bg-gradient-to-l from-cyan-400/18 to-purple-500/18 text-white shadow-[0_10px_30px_rgba(0,200,240,0.22)]"
            )}
          >
            {cat.category_name}
          </button>
        ))}
      </div>
    </div>
  );
}
