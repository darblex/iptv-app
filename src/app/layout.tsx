import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import BottomNav from "@/components/bottom-nav";
import PWARegister from "@/components/pwa-register";
import { cn } from "@/lib/utils";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "IL IPTV",
  description: "חוויית הסטרימינג הקולנועית של ישראל",
  themeColor: "#0A0A0F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body
        className={cn(
          heebo.variable,
          "antialiased bg-[#0A0A0F] text-white min-h-screen flex flex-col"
        )}
      >
        <div className="relative flex-1 w-full">
          <Navbar />
          <main className="pb-20 lg:pb-0">{children}</main>
          <BottomNav />
        </div>
        <PWARegister />
      </body>
    </html>
  );
}
