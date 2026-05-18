"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  Radio,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { StreamType } from "@/types/content";

interface Props {
  src: string;
  type: StreamType;
  title?: string;
  poster?: string;
}

const VOLUME_KEY = "iptv-player-volume";
const MUTED_KEY = "iptv-player-muted";
const MAX_AUTO_RETRIES = 3;

export default function VideoPlayer({ src, type, title, poster }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const tsRef = useRef<{ destroy: () => void } | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState({ current: 0, duration: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [, setRetryCount] = useState(0);
  const [loadKey, setLoadKey] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "retrying" | "error">("idle");
  const [tapToPlay, setTapToPlay] = useState(false);

  const cleanupPlayers = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    hlsRef.current?.destroy();
    hlsRef.current = null;
    tsRef.current?.destroy();
    tsRef.current = null;
  }, []);

  const scheduleRetry = useCallback((reason = "הזרם נותק") => {
    setRetryCount((current) => {
      if (current >= MAX_AUTO_RETRIES) {
        setStatus("error");
        setErrorMessage(`${reason}. נסה שוב ידנית.`);
        return current;
      }

      const next = current + 1;
      setStatus("retrying");
      setErrorMessage(`${reason}. מנסה שוב (${next}/${MAX_AUTO_RETRIES})...`);
      retryTimerRef.current = setTimeout(() => setLoadKey((v) => v + 1), 900 * next);
      return next;
    });
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    let cancelled = false;

    cleanupPlayers();
    setErrorMessage(null);
    setPlaying(false);
    setStatus("loading");

    const savedVolume = Number(localStorage.getItem(VOLUME_KEY));
    if (Number.isFinite(savedVolume)) video.volume = Math.min(1, Math.max(0, savedVolume));
    const savedMuted = localStorage.getItem(MUTED_KEY) === "1";
    video.muted = savedMuted;
    setMuted(savedMuted);
    video.removeAttribute("src");
    video.load();

      const attach = async () => {
      if (cancelled) return;
      const bustedSrc = loadKey > 0 ? `${src}${src.includes("?") ? "&" : "?"}_r=${Date.now()}` : src;

      // For direct ilvip.net .ts URLs (client-side playback) use mpegts.js directly.
      // For .m3u8 use HLS.js.
      if (bustedSrc.includes(".m3u8") && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: type === "live",
          liveSyncDurationCount: type === "live" ? 2 : undefined,
          maxBufferLength: type === "live" ? 12 : 45,
          backBufferLength: 30,
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            try {
              hls.startLoad();
            } catch {
              scheduleRetry("שגיאת רשת בנגן");
            }
            return;
          }
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            try {
              hls.recoverMediaError();
            } catch {
              scheduleRetry("שגיאת מדיה בנגן");
            }
            return;
          }
          scheduleRetry("שגיאת נגן");
        });
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!cancelled) {
            video.play().catch(() => setTapToPlay(true));
          }
        });
        hls.loadSource(bustedSrc);
        hls.attachMedia(video);
        hlsRef.current = hls;
        return;
      }

      // Fallback: mpegts.js for raw MPEG-TS live streams
      if (type === "live") {
        const mpegts = (await import("mpegts.js")).default;
        if (cancelled) return;

        if (mpegts.isSupported()) {
          const player = mpegts.createPlayer({ type: "mpegts", url: bustedSrc, isLive: true });
          player.attachMediaElement(video);
          player.load();
          tsRef.current = player;
          video.play().catch(() => setTapToPlay(true));
          return;
        }
      }

      // Direct source fallback — only if URL looks like a valid video file
      if (/\.(mp4|mkv|avi|mov|webm|ts)(\?|$)/i.test(bustedSrc)) {
        video.src = bustedSrc;
        video.play().catch(() => setTapToPlay(true));
      } else {
        scheduleRetry("פורמט לא נתמך");
      }
    };

    attach().catch((error) => {
      if (!cancelled) {
        console.error("Video attach error", error);
        scheduleRetry("שגיאה בטעינת הזרם");
      }
    });

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWaiting = () => setStatus("loading");
    const onCanPlay = () => {
      setStatus("ready");
      setErrorMessage(null);
    };
    const onVolume = () => {
      localStorage.setItem(VOLUME_KEY, String(video.volume));
      localStorage.setItem(MUTED_KEY, video.muted ? "1" : "0");
      setMuted(video.muted);
    };
    const onTimeUpdate = () => setTime({ current: video.currentTime, duration: video.duration || 0 });
    const onError = () => scheduleRetry("פורמט הווידאו לא נתמך או שהזרם נפל");
    const onFullscreen = () => setIsFullscreen(!!document.fullscreenElement);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("volumechange", onVolume);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("error", onError);
    document.addEventListener("fullscreenchange", onFullscreen);

    return () => {
      cancelled = true;
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("volumechange", onVolume);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("error", onError);
      document.removeEventListener("fullscreenchange", onFullscreen);
      cleanupPlayers();
    };
  }, [src, type, loadKey, cleanupPlayers, scheduleRetry]);

  useEffect(() => {
    setRetryCount(0);
    setLoadKey(0);
  }, [src]);

  const manualRetry = () => {
    setRetryCount(0);
    setErrorMessage(null);
    setStatus("loading");
    setLoadKey((v) => v + 1);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch((error) => {
        console.error("Play error", error);
        setErrorMessage("לא ניתן להפעיל את הזרם — לחץ שוב או נסה רענון");
      });
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  const format = (seconds: number) => {
    if (!seconds || !Number.isFinite(seconds)) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  const seek = (value: number) => {
    const video = videoRef.current;
    if (!video || type === "live") return;
    video.currentTime = value;
  };

  const toggleFullscreen = () => {
    const wrap = videoRef.current?.parentElement;
    if (!wrap) return;
    if (!document.fullscreenElement) wrap.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const enablePip = async () => {
    try {
      const pipVideo = videoRef.current as (HTMLVideoElement & {
        requestPictureInPicture?: () => Promise<PictureInPictureWindow>;
      }) | null;
      if (pipVideo?.requestPictureInPicture) await pipVideo.requestPictureInPicture();
    } catch (error) {
      console.error("PiP error", error);
    }
  };

  const statusLabel = status === "retrying" ? "מתחבר מחדש" : status === "loading" ? "טוען" : type === "live" ? "שידור חי" : "וידאו";

  return (
    <div className="relative aspect-video overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c14] shadow-[0_25px_70px_rgba(0,0,0,0.4)]">
      <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-100 ring-1 ring-rose-500/40">
        <Radio className="h-3.5 w-3.5" /> {statusLabel}
      </div>
      <video ref={videoRef} poster={poster} controls={false} playsInline className="h-full w-full bg-black" />

      {tapToPlay && (
        <button
          onClick={() => {
            const video = videoRef.current;
            if (video) {
              video.play()
                .then(() => setTapToPlay(false))
                .catch((e) => {
                  console.error("Tap-to-play error", e);
                  setErrorMessage("לא ניתן להפעיל את הזרם — בדוק חיבור או נסה רעננ");
                });
            }
          }}
          className="pointer-events-auto absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/50 text-white backdrop-blur-sm"
        >
          <Play className="h-16 w-16 drop-shadow-xl" />
          <span className="text-sm font-semibold">לחץ להפעלה</span>
        </button>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />

      {(status === "loading" || status === "retrying") && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-black/25 text-sm font-semibold text-white">
          <div className="rounded-full border border-white/10 bg-black/50 px-4 py-2 backdrop-blur">{statusLabel}...</div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col gap-3 p-4 lg:p-6">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-slate-300">{type === "live" ? "שידור רציף" : "נגן וידאו"}</p>
            <h3 className="text-lg font-bold text-white">{title}</h3>
          </div>
          <div className="flex items-center gap-2 self-end">
            <button onClick={togglePlay} className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25">
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} {playing ? "הפסק" : "נגן"}
            </button>
            <button onClick={manualRetry} className="pointer-events-auto rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20" title="נסה שוב">
              <RotateCcw className="h-4 w-4" />
            </button>
            <button onClick={toggleMute} className="pointer-events-auto rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20">
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button onClick={enablePip} className="pointer-events-auto rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20" title="תמונה בתוך תמונה">
              <PictureInPicture2 className="h-4 w-4" />
            </button>
            <button onClick={toggleFullscreen} className="pointer-events-auto rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20">
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {type !== "live" && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300">{format(time.current)}</span>
            <input type="range" min={0} max={time.duration || 0} step={0.1} value={time.current} onChange={(e) => seek(Number(e.target.value))} className="pointer-events-auto h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-primary" />
            <span className="text-xs text-slate-300">{format(time.duration)}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-400/30 bg-rose-500/20 px-3 py-2 text-sm text-rose-100">
            <span>{errorMessage}</span>
            <button onClick={manualRetry} className="pointer-events-auto rounded-full bg-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/20">נסה שוב</button>
          </div>
        )}
      </div>
    </div>
  );
}
