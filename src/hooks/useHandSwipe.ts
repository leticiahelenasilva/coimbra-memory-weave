import { useEffect, useRef, useState } from "react";

interface Options {
  enabled: boolean;
  onSwipe: (dir: "left" | "right") => void;
  cooldownMs?: number;
  threshold?: number; // motion threshold 0..1
}

/**
 * Mock "hand swipe" detection using the webcam.
 * Compares motion energy on the left vs right halves of the frame.
 * When one side has significantly more motion than the other (above
 * `threshold`), we fire `onSwipe`. NOTE: the camera is mirrored, so when
 * the user moves their hand to THEIR right, motion appears on the LEFT
 * half of the video — we map accordingly so the dir matches user intent.
 */
export const useHandSwipe = ({
  enabled,
  onSwipe,
  cooldownMs = 1200,
  threshold = 0.06,
}: Options) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevFrameRef = useRef<ImageData | null>(null);
  const lastFireRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;

  const [status, setStatus] = useState<"idle" | "requesting" | "granted" | "denied" | "unsupported">("idle");
  const [motion, setMotion] = useState({ left: 0, right: 0 });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unsupported");
        return;
      }
      setStatus("requesting");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = document.createElement("video");
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        await video.play();
        videoRef.current = video;

        const canvas = document.createElement("canvas");
        canvas.width = 80;
        canvas.height = 60;
        canvasRef.current = canvas;
        setStatus("granted");
        loop();
      } catch (e) {
        setStatus("denied");
      }
    };

    const loop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const prev = prevFrameRef.current;

      if (prev) {
        const w = canvas.width;
        const h = canvas.height;
        const half = Math.floor(w / 2);
        let leftSum = 0;
        let rightSum = 0;
        const data = frame.data;
        const pdata = prev.data;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const d =
              Math.abs(data[i] - pdata[i]) +
              Math.abs(data[i + 1] - pdata[i + 1]) +
              Math.abs(data[i + 2] - pdata[i + 2]);
            if (d > 60) {
              if (x < half) leftSum++;
              else rightSum++;
            }
          }
        }
        const halfPixels = (w * h) / 2;
        const leftN = leftSum / halfPixels;
        const rightN = rightSum / halfPixels;
        setMotion({ left: leftN, right: rightN });

        const now = performance.now();
        if (now - lastFireRef.current > cooldownMs) {
          const diff = leftN - rightN;
          // mirrored camera → left motion = user's right hand
          if (leftN > threshold && diff > threshold * 0.6) {
            lastFireRef.current = now;
            onSwipeRef.current("right");
          } else if (rightN > threshold && -diff > threshold * 0.6) {
            lastFireRef.current = now;
            onSwipeRef.current("left");
          }
        }
      }
      prevFrameRef.current = frame;
      rafRef.current = requestAnimationFrame(loop);
    };

    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      videoRef.current = null;
      canvasRef.current = null;
      prevFrameRef.current = null;
    };
  }, [enabled, cooldownMs, threshold]);

  return { status, motion, videoRef };
};
