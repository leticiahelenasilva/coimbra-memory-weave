import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SEED_MEMORIES } from "@/data/memories";
import { Stamp } from "../Stamp";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Props {
  onContinue: () => void;
  extraMemories?: string[];
}

interface Floater {
  text: string;
  x: number; // 0..1
  y: number; // 0..1
  scale: number;
  delay: number;
  dur: number;
  dx: number;
  dy: number;
  italic: boolean;
}

const buildFloaters = (memories: string[]): Floater[] => {
  return memories.map((text, i) => {
    // pseudo-random but stable
    const r = (n: number) => ((Math.sin((i + 1) * n) + 1) / 2);
    return {
      text,
      x: 0.05 + r(12.9898) * 0.9,
      y: 0.08 + r(78.233) * 0.84,
      scale: 0.7 + r(43.7) * 0.9,
      delay: r(5.2) * 2,
      dur: 7 + r(9.1) * 8,
      dx: (r(31.7) - 0.5) * 30,
      dy: (r(17.3) - 0.5) * 30,
      italic: r(2.7) > 0.55,
    };
  });
};

export const MemoryMural = ({ onContinue, extraMemories = [] }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [floaters] = useState(() => buildFloaters([...SEED_MEMORIES, ...extraMemories]));
  // proximity 0 = far (blurred), 1 = close (clear)
  const [proximity, setProximity] = useState(0.25);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Mock "face distance" via mouse Y position (top of screen = far, bottom = close)
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ny = (e.clientY - rect.top) / rect.height;
      const clamped = Math.max(0, Math.min(1, ny));
      setProximity(clamped);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const blur = (1 - proximity) * 6; // 0..6px
  const opacityBase = 0.35 + proximity * 0.55;

  return (
    <section className="relative h-screen w-full overflow-hidden bg-background">
      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between p-6">
        <Stamp>mural · {floaters.length} memórias</Stamp>
        <div className="flex items-center gap-3">
          <div className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            distância
          </div>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-ink transition-all duration-300"
              style={{ width: `${proximity * 100}%` }}
            />
          </div>
          <span className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-ink">
            {proximity > 0.65 ? "perto" : proximity > 0.35 ? "médio" : "longe"}
          </span>
        </div>
      </div>

      {/* Mural */}
      <div ref={containerRef} className="absolute inset-0">
        {floaters.map((f, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <motion.button
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: opacityBase, y: 0 }}
              transition={{ duration: 1.2, delay: f.delay * 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer select-none whitespace-nowrap text-ink outline-none"
              style={{
                left: `${f.x * 100}%`,
                top: `${f.y * 100}%`,
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: f.italic ? "italic" : "normal",
                fontSize: `${f.scale * 1.4}rem`,
                filter: `blur(${isHovered ? 0 : blur}px)`,
                opacity: isHovered ? 1 : opacityBase,
                transition: "filter 250ms ease, opacity 250ms ease",
                // drift animation vars
                ['--dx' as string]: `${f.dx}px`,
                ['--dy' as string]: `${f.dy}px`,
                ['--dur' as string]: `${f.dur}s`,
              }}
            >
              <span className="animate-drift inline-block">
                {isHovered ? <span className="highlight-yellow">{f.text}</span> : f.text}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Center hint when far */}
      {proximity < 0.35 && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-serif-display text-2xl italic text-muted-foreground"
          >
            move o cursor para baixo · aproxima-te
          </motion.p>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-between p-6">
        <span className="max-w-md font-mono-ui text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          memórias deixadas por quem passou. quando estiveres pronto, deixa a tua.
        </span>
        <Button
          onClick={onContinue}
          className="group h-12 rounded-full bg-ink px-6 text-paper hover:bg-ink/90"
        >
          deixar a minha memória
          <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </section>
  );
};
