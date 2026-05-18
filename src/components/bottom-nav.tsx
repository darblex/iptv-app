"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TvMinimalPlay, Clapperboard, Library, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "בית", icon: Home },
  { href: "/live", label: "לייב", icon: TvMinimalPlay },
  { href: "/movies", label: "סרטים", icon: Clapperboard },
  { href: "/series", label: "סדרות", icon: Library },
  { href: "/search", label: "חיפוש", icon: Search },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#05050a]/85 shadow-[0_-10px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl lg:hidden">
      <div className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2 text-xs text-slate-300">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all",
                active ? "bg-gradient-to-b from-cyan-400/15 to-purple-500/15 text-white ring-1 ring-cyan-300/20" : "hover:text-white"
              )}
            >
              {active && <span className="absolute -top-1 h-1 w-5 rounded-full bg-gradient-to-l from-cyan-300 to-purple-400 shadow-[0_0_16px_rgba(0,200,240,0.7)]" />}
              <Icon className={cn("h-5 w-5", active && "text-cyan-300 drop-shadow-[0_0_10px_rgba(0,200,240,0.7)]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
