"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, TvMinimalPlay, Clapperboard, Library, Home, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "בית", icon: Home },
  { href: "/live", label: "לייב", icon: TvMinimalPlay },
  { href: "/movies", label: "סרטים", icon: Clapperboard },
  { href: "/series", label: "סדרות", icon: Library },
  { href: "/search", label: "חיפוש", icon: Search },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 hidden w-full lg:block">
      <div className="backdrop-blur-xl bg-[#0a0a0f]/80 border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary/80 via-primary to-blue-500 shadow-lg shadow-primary/30 flex items-center justify-center text-lg">
              <Flame className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm text-slate-300">פרימיום</p>
              <p className="text-xl text-white">IL IPTV</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            {links.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "group flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all",
                    active
                      ? "bg-white/10 text-white shadow-[0_10px_40px_rgba(37,99,235,0.35)]"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
