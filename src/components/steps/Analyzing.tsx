import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { detectEmotion, EMOTIONS, EmotionKey } from "@/data/emotions";

interface Props {
  memory: string;
  onDone: (emotion: EmotionKey) => void;
}

const PHRASES = [
  "identificando sentimento",
  "cuidando da sua memória",
  "gerando postal",
];

const MIN_DURATION_MS = 3500;
const MAX_DURATION_MS = 8000;

export const Analyzing = ({ memory, onDone }: Props) => {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedAt = useRef(performance.now());

  // Rotate phrases
  useEffect(() => {
    const id = window.setInterval(
      () => setPhraseIdx((i) => (i + 1) % PHRASES.length),
      1400
    );
    return () => window.clearInterval(id);
  }, []);

  // Detect emotion (with min animation time + max timeout)
  useEffect(() => {
    let done = false;
    const finish = (emotion: EmotionKey) => {
      if (done) return;
      done = true;
      const elapsed = performance.now() - startedAt.current;
      const wait = Math.max(0, MIN_DURATION_MS - elapsed);
      window.setTimeout(() => onDone(emotion), wait);
    };

    const fallback = () => finish(detectEmotion(memory).key);

    const timeout = window.setTimeout(fallback, MAX_DURATION_MS);

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("detect-emotion", {
          body: { text: memory },
        });
        if (error || !data?.emotion || !(data.emotion in EMOTIONS)) {
          fallback();
        } else {
          finish(data.emotion as EmotionKey);
        }
      } catch {
        fallback();
      } finally {
        window.clearTimeout(timeout);
      }
    })();

    return () => {
      done = true;
      window.clearTimeout(timeout);
    };
  }, [memory, onDone]);

  // Animated halftone canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    const onResize = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      resize();
    };
    window.addEventListener("resize", onResize);

    const t0 = performance.now();
    const draw = () => {
      const t = (performance.now() - t0) / 1000;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const spacing = 14;
      const cols = Math.ceil(w / spacing) + 1;
      const rows = Math.ceil(h / spacing) + 1;
      const maxDist = Math.hypot(cx, cy);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * spacing;
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.hypot(dx, dy);
          const ratio = dist / maxDist; // 0 center → 1 edge
          // wave that radiates outward
          const wave = Math.sin(ratio * 10 - t * 1.8);
          const baseAlpha = 0.08 + (1 - ratio) * 0.35;
          const alpha = Math.max(0.04, baseAlpha + wave * 0.15);
          const radius = 0.8 + (1 - ratio) * 1.6 + Math.max(0, wave) * 0.6;
          ctx.fillStyle = `hsla(35, 25%, 90%, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  const glowHues = useMemo(() => [25, 320, 175, 270], []);

  return (
    <section className="relative grid min-h-screen w-full place-items-center overflow-hidden bg-ink px-6 py-10">
      {/* Slow color glow behind card */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        animate={{
          background: glowHues.map(
            (h) =>
              `radial-gradient(circle at 50% 50%, hsl(${h} 60% 35% / 0.35), transparent 60%)`
          ),
        }}
        transition={{ duration: 8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />

      <div className="relative w-full max-w-2xl">
        <div className="relative aspect-square overflow-hidden rounded-[2.5rem] border border-paper/10 bg-ink shadow-2xl">
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

          {/* Centered text */}
          <div className="absolute inset-0 grid place-items-center px-8 text-center">
            <div>
              <p className="mb-6 font-mono-ui text-[10px] uppercase tracking-[0.35em] text-paper/50">
                a preparar a tua memória
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={phraseIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="font-serif italic text-paper"
                  style={{ fontSize: "clamp(1.4rem, 3.2vw, 2.4rem)" }}
                >
                  {PHRASES[phraseIdx]}…
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Indeterminate progress bar */}
          <div className="absolute inset-x-10 bottom-8 h-px overflow-hidden rounded-full bg-paper/10">
            <motion.div
              className="h-full w-1/3 rounded-full bg-paper/60"
              animate={{ x: ["-100%", "300%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
