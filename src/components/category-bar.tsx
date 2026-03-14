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
            "px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm transition hover:border-primary/40 hover:text-white",
            !active && "bg-primary/20 text-white border-primary/40 shadow-[0_10px_30px_rgba(37,99,235,0.25)]"
          )}
        >
          {allLabel}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.category_id}
            onClick={() => onSelect?.(cat.category_id)}
            className={cn(
              "px-4 py-2 rounded-full border border-white/5 bg-white/5 text-sm text-slate-200 transition hover:border-primary/40 hover:text-white",
              active === cat.category_id &&
                "bg-primary/15 border-primary/50 text-white shadow-[0_10px_30px_rgba(37,99,235,0.25)]"
            )}
          >
            {cat.category_name}
          </button>
        ))}
      </div>
    </div>
  );
}
