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
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0b0b12]/90 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2 text-xs text-slate-300">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all",
                active ? "text-white bg-white/5" : "hover:text-white"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "text-primary")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
