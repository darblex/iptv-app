import type { EpgEntry } from "@/types/content";

interface Props {
  now?: EpgEntry | null;
  next?: EpgEntry | null;
}

const formatTime = (timestamp?: number) => {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
};

export default function EPGStrip({ now, next }: Props) {
  return (
    <div className="mt-3 rounded-xl bg-white/5 px-4 py-3 text-sm text-slate-200 border border-white/5">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-semibold">עכשיו</span>
          </div>
          <span className="text-xs text-slate-400">{formatTime(now?.start_timestamp ?? now?.start)}</span>
        </div>
        <p className="truncate text-sm text-slate-100">{now?.title || "לא זמין"}</p>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="h-1 w-6 rounded-full bg-white/10" />
          <span className="font-semibold">הבא</span>
        </div>
        <span>{formatTime(next?.start_timestamp ?? next?.start)}</span>
      </div>
      <p className="truncate text-xs text-slate-300">{next?.title || "לא זמין"}</p>
    </div>
  );
}
