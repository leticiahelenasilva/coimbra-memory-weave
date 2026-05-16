import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { detectEmotion, EMOTIONS, EmotionKey } from "@/data/emotions";
import PixelBlast from "@/components/PixelBlast";

interface Props {
  memory: string;
  onDone: (emotion: EmotionKey) => void;
}

const PHRASES = [
  "identificando sentimento",
  "cuidando da sua memória",
  "gerando postal",
];

const MIN_DURATION_MS = 8000;
const MAX_DURATION_MS = 12000;

export const Analyzing = ({ memory, onDone }: Props) => {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const startedAt = useRef(performance.now());

  useEffect(() => {
    const id = window.setInterval(
      () => setPhraseIdx((i) => (i + 1) % PHRASES.length),
      1600
    );
    return () => window.clearInterval(id);
  }, []);

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
        if (error || !data?.emotion || !(data.emotion in EMOTIONS)) fallback();
        else finish(data.emotion as EmotionKey);
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

  return (
    <section className="relative grid min-h-screen w-full place-items-center overflow-hidden bg-ink px-6 py-10">
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_45%,rgba(232,201,160,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.18))]"
        aria-hidden="true"
      />

      {/* PixelBlast animated background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <PixelBlast
          variant="square"
          pixelSize={4}
          color="#5d5d5d"
          patternScale={2}
          patternDensity={1}
          pixelSizeJitter={0}
          enableRipples
          rippleSpeed={0.4}
          rippleThickness={0.12}
          rippleIntensityScale={1.0}
          speed={0.5}
          edgeFade={0.25}
          transparent
        />
      </div>

      {/* Centered text — AA legible, large display */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
        <p className="mb-8 font-mono-ui text-xs uppercase tracking-[0.4em] text-paper/80">
          a preparar a tua memória
        </p>
        <AnimatePresence mode="wait">
          <motion.h1
            key={phraseIdx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif italic text-paper drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]"
            style={{
              fontSize: "clamp(2.75rem, 8vw, 6rem)",
              lineHeight: 1.05,
              textShadow: "0 2px 18px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.6)",
            }}
          >
            {PHRASES[phraseIdx]}…
          </motion.h1>
        </AnimatePresence>

        <div className="mx-auto mt-12 h-[2px] w-64 overflow-hidden rounded-full bg-paper/15">
          <motion.div
            className="h-full w-1/3 rounded-full bg-paper"
            animate={{ x: ["-100%", "300%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </section>
  );
};
