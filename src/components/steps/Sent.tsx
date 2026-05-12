import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Fog } from "../Fog";
import { SEED_MEMORIES } from "@/data/memories";
import { EMOTIONS, EmotionKey } from "@/data/emotions";
import { Home, RotateCcw } from "lucide-react";

interface Props {
  memory: string;
  extraMemories: string[];
  emotion?: EmotionKey;
  onAgain: () => void;
  onHome: () => void;
}

// Stable pseudo-random positioning
const positionFor = (i: number) => {
  const r = (n: number) => ((Math.sin((i + 1) * n) + 1) / 2);
  return {
    x: 0.06 + r(12.9898) * 0.88,
    y: 0.1 + r(78.233) * 0.78,
    scale: 0.7 + r(43.7) * 0.8,
    italic: r(2.7) > 0.55,
    rot: (r(5.1) - 0.5) * 6,
  };
};

export const Sent = ({ memory, extraMemories, emotion, onAgain, onHome }: Props) => {
  const accent = emotion ? EMOTIONS[emotion].variants[0].accent : undefined;
  const all = [...SEED_MEMORIES, ...extraMemories.filter((m) => m !== memory)];

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-background">
      <Fog intensity={0.8} />

      {/* Top */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between p-6">
        <span className="font-mono-ui text-[10px] uppercase tracking-[0.22em] text-muted-foreground">enviado · obrigado</span>
        <span className="font-mono-ui text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          mural · {all.length + 1} memórias
        </span>
      </div>

      {/* Mural background */}
      <div className="absolute inset-0">
        {all.map((text, i) => {
          const p = positionFor(i);
          return (
            <span
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-ink/40"
              style={{
                left: `${p.x * 100}%`,
                top: `${p.y * 100}%`,
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: p.italic ? "italic" : "normal",
                fontSize: `${p.scale * 1.2}rem`,
                transform: `translate(-50%, -50%) rotate(${p.rot}deg)`,
                filter: "blur(2px)",
              }}
            >
              {text}
            </span>
          );
        })}
      </div>

      {/* Highlighted new memory */}
      <div className="relative z-20 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="mb-4 font-mono-ui text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            a tua memória vive agora aqui
          </p>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.6, delay: 0.4 }}
            className="font-serif-display text-4xl leading-[1.05] text-ink md:text-6xl text-balance"
          >
            <span className="opacity-60">o que fica de Coimbra é</span>{" "}
            <span
              className="italic"
              style={
                accent
                  ? {
                      background: accent,
                      color: "hsl(30 10% 12%)",
                      padding: "0 0.15em",
                      borderRadius: "0.15em",
                      boxDecorationBreak: "clone",
                      WebkitBoxDecorationBreak: "clone",
                    }
                  : undefined
              }
            >
              {memory}
            </span>
            <span style={accent ? { color: accent } : undefined}>.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-10 font-serif italic text-muted-foreground"
          >
            partiu com o vento do Mondego — fica para quem chegar depois.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Button
              onClick={onAgain}
              size="lg"
              className="h-14 rounded-full bg-ink px-8 text-paper hover:bg-ink/90"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              deixar outra memória
            </Button>
            <Button
              onClick={onHome}
              variant="outline"
              size="lg"
              className="h-14 rounded-full border-ink/30 px-8 hover:border-ink"
            >
              <Home className="mr-2 h-4 w-4" />
              voltar ao início
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
