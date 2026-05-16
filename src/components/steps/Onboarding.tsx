import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Mic } from "lucide-react";
import { Fog } from "../Fog";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { EMOTION_SEEDS } from "@/data/memories";
import { EMOTIONS } from "@/data/emotions";
import { ScrollStack, ScrollStackItem } from "../ScrollStack";
import postalImage from "../../../assets/postal.png";

interface Props {
  onBegin: () => void;
  onVoiceTrigger: () => void;
}

const TRIGGER = "o que fica de coimbra";

export const Onboarding = ({ onBegin, onVoiceTrigger }: Props) => {
  // Mic auto-enabled on mount; user can still see status indicator in header.
  const [armed, setArmed] = useState(true);
  const [micDenied, setMicDenied] = useState(false);
  const { transcript, interim, supported, listening, reset } = useSpeechRecognition({
    enabled: armed,
    lang: "pt-PT",
  });

  // Proactively prompt for mic permission on mount so SR can start without UI gesture
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return;
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        // Release immediately — Web Speech API will reopen its own stream
        stream.getTracks().forEach((t) => t.stop());
        setMicDenied(false);
      })
      .catch(() => setMicDenied(true));
  }, []);

  // Detect trigger phrase → stop SR and jump straight into recording
  useEffect(() => {
    if (!armed) return;
    const all = (transcript + " " + interim).toLowerCase();
    if (all.includes(TRIGGER)) {
      setArmed(false);
      reset();
      onVoiceTrigger();
    }
  }, [armed, transcript, interim, reset, onVoiceTrigger]);


  // Build a long, repeated typographic marquee with emotion-driven styling
  const marqueeItems = useMemo(() => {
    return EMOTION_SEEDS.map((s) => {
      const e = EMOTIONS[s.emotion];
      const v = e.variants[0];
      return { text: s.text, fontCls: v.fontCls, ink: v.ink, accent: v.accent, label: e.label };
    });
  }, []);

  const muralRef = useRef<HTMLDivElement>(null);
  const scrollToMural = () => muralRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="relative min-h-screen w-full bg-background">
      {/* ============ TOP NAV ============ */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-10 py-6">
          <a href="/" className="text-lg text-ink">
            O que fica de <span className="font-serif-display italic">Coimbra</span>
          </a>
          <nav className="flex items-center gap-10">
            <button onClick={onBegin} className="text-sm text-ink/80 transition-colors hover:text-ink">
              Postais
            </button>
            <button onClick={scrollToMural} className="text-sm text-ink/80 transition-colors hover:text-ink">
              Mural de memórias
            </button>
            <button className="text-sm text-ink/80 transition-colors hover:text-ink">
              Sobre o projeto
            </button>
            <button
              onClick={() => { reset(); setArmed(true); }}
              className="inline-flex items-center gap-2 rounded-full bg-yellow px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-yellow/90"
              title={listening ? "à escuta" : "ativar microfone"}
            >
              {listening ? "à escuta…" : "Fale o que fica de Coimbra"}
              <Mic className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden px-6 pb-20 pt-10">
        <Fog />
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="relative mx-auto mb-10 flex h-[260px] w-full max-w-[520px] items-center justify-center">
            <motion.div
              initial={{ y: 18, opacity: 0, rotate: -2 }}
              animate={{ y: [0, -12, 0], opacity: 1, rotate: [-2, 1.5, -2] }}
              transition={{
                opacity: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                y: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
              }}
              className="w-full max-w-[430px] drop-shadow-[0_24px_45px_rgba(32,27,22,0.16)]"
            >
              <img
                src={postalImage}
                alt="Postal ilustrado de Coimbra"
                className="block h-auto w-full select-none object-contain"
                draggable={false}
              />
            </motion.div>
          </div>

          <h1 className="font-serif-display text-[clamp(2.6rem,6vw,5rem)] font-medium leading-[0.92] text-ink">
            O que fica de<br />
            <span className="italic">Coimbra</span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            Adicione a sua memória ao arquivo e receba um cartão postal único da memória coletiva.
          </p>

          <button onClick={scrollToMural} className="mt-10 flex flex-col items-center gap-2 text-sm font-medium text-gold-deep transition-opacity hover:opacity-80">
            <span className="underline underline-offset-4">Veja o que ficou de Coimbra</span>
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </button>
        </div>
      </section>

      {/* ============ MARQUEE OF MEMORIES ============ */}
      <section ref={muralRef} className="relative overflow-hidden border-y border-border/60 bg-gradient-to-b from-background to-muted/30 py-12">
        {[0, 1, 2].map((row) => (
          <div key={row} className="mb-6 flex w-full overflow-hidden last:mb-0" style={{ ['--marquee-dur' as string]: `${50 + row * 14}s` }}>
            <div className={`flex shrink-0 items-center gap-12 whitespace-nowrap px-6 ${row % 2 === 1 ? "" : "animate-marquee"}`} style={row % 2 === 1 ? { animation: `marquee ${64}s linear infinite reverse` } : undefined}>
              {[...marqueeItems, ...marqueeItems].map((m, i) => (
                <span
                  key={`${row}-${i}`}
                  className={`${m.fontCls} text-[clamp(1.4rem,2.6vw,2.4rem)]`}
                  style={{ color: m.ink }}
                  title={m.label}
                >
                  <span style={{ background: `linear-gradient(180deg, transparent 60%, ${m.accent}55 60%)`, padding: "0 0.08em" }}>
                    {m.text}
                  </span>
                  <span className="mx-6 text-ink/30">/</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ============ STACKED CARDS (postcards preview + about) ============ */}
      <ScrollStack className="bg-muted/30">
        <ScrollStackItem>
          <section className="relative overflow-hidden rounded-3xl bg-card px-6 py-16 shadow-soft">
            <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-3">
              <div className="paper relative aspect-[7/5] -rotate-3 rounded-2xl p-5" style={{ background: "hsl(30 8% 12%)", color: "hsl(60 20% 97%)" }}>
                <p className="font-serif italic text-[10px] opacity-70">o que fica de Coimbra é</p>
                <p className="mt-2 font-mono-ui text-[11px] leading-tight">Depois de escurecer, não vou ao Jardim da Sereia / Vou pro jardim da AAC! / Tenho uma relação amor/ódio com o 34…</p>
              </div>

              <div className="text-center font-serif text-sm text-muted-foreground">
                Recolha cartões postais únicos como recordação de
                <span className="block font-medium italic text-ink">O que fica de Coimbra</span>
              </div>

              <div className="paper relative aspect-[7/5] rotate-2 rounded-2xl p-5">
                <p className="font-serif italic text-lg text-lilac-deep">O que fica de Coimbra é…</p>
                <p className="mt-3 font-serif text-[11px] leading-relaxed text-ink/80">
                  O Jardim da Sereia ao anoitecer evoca memórias sombrias. As sombras dançam sob as árvores antigas…
                </p>
                <div className="absolute right-4 top-4 h-10 w-8 rounded-sm" style={{ background: "var(--gradient-stamp)" }} />
              </div>
            </div>

            <div className="mt-14 flex justify-center">
              <Button
                onClick={() => { if (!armed) { reset(); setArmed(true); } onBegin(); }}
                size="lg"
                className="h-12 rounded-full bg-yellow px-7 text-ink hover:bg-yellow/90"
              >
                Fale o que fica de Coimbra
                <Mic className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </section>
        </ScrollStackItem>

        <ScrollStackItem>
          <section className="rounded-3xl bg-card px-6 py-16 shadow-soft">
            <div className="mx-auto max-w-3xl p-6">
              <p className="mb-3 font-mono-ui text-[10px] uppercase tracking-[0.25em] text-muted-foreground">sobre o projeto</p>
              <p className="text-lg leading-relaxed text-ink/85">
                <span className="font-medium text-ink">O que fica de Coimbra</span> é um memorial digital interativo
                que recolhe vozes de quem viveu, passou ou sonhou esta cidade. Cada memória é gravada, transformada
                em tipografia generativa e enviada como um postal — para o mural coletivo e para quem vier depois.
              </p>
              <div className="ticket-divide my-8 h-px" />
              <p className="font-mono-ui text-[11px] uppercase tracking-[0.2em] text-ink/80">
                como começar · diz em voz alta <span className="highlight-yellow text-ink">"o que fica de Coimbra é…"</span>
              </p>
              <div className="mt-4 flex items-center gap-3 font-mono-ui text-[10px] uppercase tracking-[0.22em]">
                <span className={`h-2 w-2 rounded-full ${listening ? "animate-pulse bg-destructive" : "bg-muted-foreground/40"}`} />
                {micDenied && <span className="text-destructive">microfone bloqueado · permite o acesso no navegador</span>}
                {!micDenied && armed && listening && <span className="text-ink">à escuta… diz "o que fica de Coimbra"</span>}
                {!micDenied && armed && !listening && supported && <span className="text-muted-foreground">a iniciar microfone…</span>}
                {!supported && <span className="text-destructive">reconhecimento de voz indisponível</span>}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {micDenied && (
                  <Button onClick={() => { reset(); setArmed(true); setMicDenied(false); navigator.mediaDevices?.getUserMedia({ audio: true }).then((s) => s.getTracks().forEach(t => t.stop())).catch(() => setMicDenied(true)); }} className="h-11 rounded-full bg-ink text-paper hover:bg-ink/90">
                    <Mic className="mr-2 h-4 w-4" /> ativar microfone
                  </Button>
                )}
                <Button onClick={onBegin} variant="secondary" className="h-11 rounded-full">
                  ver mural primeiro <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </section>
        </ScrollStackItem>
      </ScrollStack>

      {/* ============ FOOTER ============ */}
      <footer className="relative overflow-hidden bg-ink px-6 py-14 text-paper">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2" style={{ background: "hsl(var(--yellow))", clipPath: "ellipse(60% 110% at 100% 50%)" }} />
        <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-6 md:grid-cols-2">
          <h2 className="font-serif-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95]">
            O que fica de<br /><span className="italic">Coimbra</span>
          </h2>
          <ul className="space-y-2 text-right font-mono-ui text-sm uppercase tracking-[0.18em] text-ink">
            <li><button className="underline-offset-4 hover:underline">Sobre o projeto</button></li>
            <li><button onClick={scrollToMural} className="underline-offset-4 hover:underline">Mural de memórias</button></li>
            <li><button onClick={onBegin} className="underline-offset-4 hover:underline">Postais</button></li>
          </ul>
        </div>
        <p className="relative z-10 mt-10 text-center font-mono-ui text-[10px] uppercase tracking-[0.22em] text-paper/60">
          Copyright 2026 · Letícia Helena e Rodrigo Pablo · Universidade de Coimbra · Departamento de Engenharia Informática
        </p>
      </footer>
    </div>
  );
};
