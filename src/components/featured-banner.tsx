"use client";

import { useEffect, useMemo, useState } from "react";
import { Play, Flame } from "lucide-react";
import type { FeaturedItem } from "@/types/content";
import { useRouter } from "next/navigation";

interface Props {
  items: FeaturedItem[];
}

export default function FeaturedBanner({ items }: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  const safeItems = useMemo(() => (items.length ? items : []), [items]);

  useEffect(() => {
    if (!safeItems.length) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % safeItems.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [safeItems]);

  if (!safeItems.length) return null;

  const current = safeItems[index];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#10101a] to-[#07070d] shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
      <div
        className="relative aspect-[16/7] w-full"
        style={{
          backgroundImage: current.image ? `url(${current.image})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="fade-overlay" />
        <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs text-amber-300">
            <Flame className="h-4 w-4" /> {current.tag || "מומלץ"}
          </div>
          <h2 className="text-3xl font-extrabold text-white drop-shadow-lg lg:text-4xl">{current.title}</h2>
          {current.description && (
            <p className="mt-3 max-w-2xl text-sm text-slate-200 lg:text-base">
              {current.description}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => router.push(`/watch/${current.type}/${current.id}`)}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_15px_40px_rgba(37,99,235,0.35)] transition hover:bg-primary/90"
            >
              <Play className="h-4 w-4" /> צפו עכשיו
            </button>
            <div className="flex gap-2">
              {safeItems.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-6 rounded-full transition ${i === index ? "bg-white" : "bg-white/30"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
