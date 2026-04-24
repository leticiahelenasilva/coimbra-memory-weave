import { motion } from "framer-motion";
import { ArrowRight, Camera, Mic } from "lucide-react";
import { Fog } from "./Fog";
import { Stamp } from "./Stamp";
import { Button } from "@/components/ui/button";

interface Props {
  onBegin: () => void;
}

export const Onboarding = ({ onBegin }: Props) => {
  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-6 py-16">
      <Fog />

      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-6">
        <Stamp>memorial digital · 2026</Stamp>
        <span className="font-mono-ui text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          coimbra · pt
        </span>
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-12">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-7"
        >
          <p className="mb-6 font-mono-ui text-xs uppercase tracking-[0.3em] text-muted-foreground">
            uma experiência multimodal
          </p>
          <h1 className="font-serif-display text-[clamp(3rem,8vw,6.5rem)] font-medium leading-[0.95] text-ink text-balance">
            o que fica<br />
            de <span className="italic">Coimbra</span>
            <span className="ml-1 text-lilac-deep">.</span>
          </h1>

          <p className="mt-8 max-w-xl font-serif-display text-2xl italic leading-snug text-muted-foreground text-balance">
            Aproxima-te. Fala devagar. Deixa que a tua memória se torne
            <span className="highlight-yellow not-italic font-medium text-ink"> tipografia</span>
            — e parta com o vento do Mondego.
          </p>

          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Button
              onClick={onBegin}
              size="lg"
              className="group h-14 rounded-full bg-ink px-8 text-base text-paper hover:bg-ink/90"
            >
              começar a recordar
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>

            <div className="flex items-center gap-3 font-mono-ui text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="flex items-center gap-1.5"><Camera className="h-3.5 w-3.5" /> câmara</span>
              <span className="opacity-40">+</span>
              <span className="flex items-center gap-1.5"><Mic className="h-3.5 w-3.5" /> microfone</span>
            </div>
          </div>
        </motion.div>

        {/* Right: postcard preview */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotate: -3 }}
          animate={{ opacity: 1, y: 0, rotate: -4 }}
          transition={{ duration: 1.1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-5"
        >
          <div className="paper relative mx-auto aspect-[5/7] w-full max-w-sm rounded-[2rem] p-7">
            <div className="flex items-start justify-between">
              <Stamp>nº 001</Stamp>
              <div className="h-12 w-12 rotate-12 rounded-md" style={{ background: "var(--gradient-stamp)" }} />
            </div>

            <p className="mt-10 font-serif-display text-3xl italic leading-tight text-ink">
              "o cheiro do Mondego ao
              <span className="highlight-yellow not-italic"> amanhecer</span>…"
            </p>

            <div className="absolute inset-x-7 bottom-7">
              <div className="ticket-divide h-px" />
              <div className="mt-4 flex items-end justify-between font-mono-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <span>remetente · anónimo</span>
                <span>via mondego</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom hint */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 text-center">
        <span className="font-mono-ui text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          ↓ aproxima-te do ecrã para ouvir as memórias ↓
        </span>
      </div>
    </section>
  );
};
