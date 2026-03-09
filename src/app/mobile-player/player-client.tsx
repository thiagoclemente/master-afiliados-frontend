"use client";

import { useEffect, useRef, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let HlsModule: any = null;
if (typeof window !== "undefined") {
  import("hls.js").then((module) => {
    HlsModule = module.default;
  });
}

type MobilePlayerClientProps = {
  playbackUrl?: string;
  errorMessage?: string;
};

export default function MobilePlayerClient({
  playbackUrl,
  errorMessage,
}: MobilePlayerClientProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playerError, setPlayerError] = useState<string | null>(
    errorMessage ?? null
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackUrl) return;

    let destroyed = false;
    const tryAutoplay = async () => {
      try {
        await video.play();
      } catch {
        // User gesture may be required on some devices.
      }
    };

    const fallbackToNative = () => {
      video.src = playbackUrl;
      video.load();
      void tryAutoplay();
    };

    if (playbackUrl.toLowerCase().includes(".m3u8")) {
      if (HlsModule && HlsModule.isSupported()) {
        const hls = new HlsModule();
        hls.loadSource(playbackUrl);
        hls.attachMedia(video);
        hls.on(HlsModule.Events.MANIFEST_PARSED, () => {
          if (destroyed) return;
          void tryAutoplay();
        });
        hls.on(HlsModule.Events.ERROR, () => {
          if (destroyed) return;
          fallbackToNative();
        });

        return () => {
          destroyed = true;
          hls.destroy();
        };
      }

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        fallbackToNative();
        return;
      }
    }

    fallbackToNative();
  }, [playbackUrl]);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "#000",
        color: "#fff",
        padding: "16px",
      }}
    >
      {playerError ? (
        <div
          style={{
            width: "min(560px, 100%)",
            textAlign: "center",
            border: "1px solid #2d2d2d",
            borderRadius: 12,
            padding: 20,
            background: "#111",
          }}
        >
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Falha no player</h1>
          <p style={{ opacity: 0.85 }}>{playerError}</p>
        </div>
      ) : (
        <video
          ref={videoRef}
          controls
          autoPlay
          playsInline
          style={{
            width: "min(980px, 100%)",
            maxHeight: "90dvh",
            backgroundColor: "#000",
            borderRadius: 12,
          }}
          onError={() => {
            setPlayerError(
              "Não foi possível reproduzir este vídeo no player alternativo."
            );
          }}
        />
      )}
    </main>
  );
}
