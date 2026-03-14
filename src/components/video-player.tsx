"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  Volume2,
  VolumeX,
  Radio,
} from "lucide-react";
import type { StreamType } from "@/types/content";

interface Props {
  src: string;
  type: StreamType;
  title?: string;
  poster?: string;
}

export default function VideoPlayer({ src, type, title, poster }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const tsRef = useRef<{ destroy: () => void } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState({ current: 0, duration: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    let cancelled = false;
    setErrorMessage(null);
    setPlaying(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (tsRef.current) {
      tsRef.current.destroy();
      tsRef.current = null;
    }

    const attach = async () => {
      // Removed HEAD probe due to IPTV provider connection limits

      if (cancelled) return;

      if (type === "live") {
        // Live streams are MPEG-TS; dynamically import mpegts.js to avoid SSR window errors
        const mpegts = (await import("mpegts.js")).default;
        if (mpegts.isSupported()) {
          const player = mpegts.createPlayer({ type: "mpegts", url: src, isLive: true });
          player.attachMediaElement(video);
          player.load();
          tsRef.current = player;
        } else if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(src);
          hls.attachMedia(video);
          hlsRef.current = hls;
        } else {
          video.src = src;
        }
      } else if (src.includes(".m3u8") && Hls.isSupported()) {
        // VOD/Series served as HLS
        const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
        hls.loadSource(src);
        hls.attachMedia(video);
        hlsRef.current = hls;
      } else {
        // VOD/Series served as mp4 — native playback
        video.src = src;
      }
    };

    attach().catch((error) => {
      if (!cancelled) {
        console.error("Video attach error", error);
        setErrorMessage("שגיאה בטעינת הזרם");
      }
    });

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => setTime({ current: video.currentTime, duration: video.duration || 0 });

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      cancelled = true;
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      hlsRef.current?.destroy();
      tsRef.current?.destroy();
    };
  }, [src, type]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch((error) => {
        console.error("Play error", error);
        setErrorMessage("לא ניתן להפעיל את הזרם");
      });
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const format = (seconds: number) => {
    if (!seconds) return "00:00";
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const seek = (value: number) => {
    const video = videoRef.current;
    if (!video || type === "live") return;
    video.currentTime = value;
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (!document.fullscreenElement) {
      video.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const enablePip = async () => {
    try {
      const pipVideo = videoRef.current as (HTMLVideoElement & {
        requestPictureInPicture?: () => Promise<PictureInPictureWindow>;
      }) | null;
      if (pipVideo?.requestPictureInPicture) {
        await pipVideo.requestPictureInPicture();
      }
    } catch (error) {
      console.error("PiP error", error);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c14] shadow-[0_25px_70px_rgba(0,0,0,0.4)]">
      <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-100 ring-1 ring-rose-500/40">
        <Radio className="h-3.5 w-3.5" /> {type === "live" ? "שידור חי" : "וידאו"}
      </div>
      <video
        ref={videoRef}
        poster={poster}
        controls={false}
        playsInline
        onError={() => setErrorMessage("פורמט הווידאו לא נתמך בדפדפן")}
        className="h-full w-full bg-black"
      />

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/40" />

      <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col gap-3 p-4 lg:p-6">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-slate-300">{type === "live" ? "שידור רציף" : "נגן וידאו"}</p>
            <h3 className="text-lg font-bold text-white">{title}</h3>
          </div>
          <div className="flex items-center gap-2 self-end">
            <button
              onClick={togglePlay}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} {playing ? "הפסק" : "נגן"}
            </button>
            <button
              onClick={toggleMute}
              className="pointer-events-auto rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              onClick={enablePip}
              className="pointer-events-auto rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              title="תמונה בתוך תמונה"
            >
              <PictureInPicture2 className="h-4 w-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="pointer-events-auto rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {type !== "live" && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300">{format(time.current)}</span>
            <input
              type="range"
              min={0}
              max={time.duration || 0}
              step={0.1}
              value={time.current}
              onChange={(e) => seek(Number(e.target.value))}
              className="pointer-events-auto h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-primary"
            />
            <span className="text-xs text-slate-300">{format(time.duration)}</span>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/20 px-3 py-2 text-sm text-rose-100">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}
