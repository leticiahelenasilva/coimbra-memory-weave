import { useEffect, useRef, useState } from "react";

interface AudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

/**
 * Devolve uma amplitude 0..1 do microfone, com fallback visual quando não há permissão.
 */
export const useMicAmplitude = (enabled: boolean) => {
  const [amplitude, setAmplitude] = useState(0);
  const [hasMic, setHasMic] = useState<boolean | null>(null);
  const rafRef = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const audioWindow = window as AudioWindow;
        const AudioContextConstructor = audioWindow.AudioContext || audioWindow.webkitAudioContext;
        if (!AudioContextConstructor) {
          throw new Error("AudioContext is not supported");
        }
        const ctx = new AudioContextConstructor();
        ctxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        const buf = new Uint8Array(analyser.frequencyBinCount);
        setHasMic(true);

        const tick = () => {
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / buf.length);
          setAmplitude(Math.min(1, rms * 2.6));
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        setHasMic(false);
        let t = 0;
        const tick = () => {
          t += 0.05;
          const sim = (Math.sin(t) * 0.5 + 0.5) * 0.35 + Math.random() * 0.1;
          setAmplitude(sim);
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      }
    };
    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      ctxRef.current?.close().catch(() => {});
    };
  }, [enabled]);

  return { amplitude, hasMic };
};
