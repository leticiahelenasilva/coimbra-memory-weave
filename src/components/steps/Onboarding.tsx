import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, Mic } from "lucide-react";
import { Fog } from "../Fog";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { EMOTION_SEEDS } from "@/data/memories";
import { EMOTIONS } from "@/data/emotions";
import { ScrollStack, ScrollStackItem } from "../ScrollStack";
import { usePostcards } from "@/hooks/usePostcards";
import { PostcardFront } from "@/components/PostcardFront";
import { Stack, type StackHandle } from "@/components/Stack";
import postalImage from "../../../assets/postal.png";

interface Props {
  onBegin: () => void;
  onVoiceTrigger: () => void;
}

const TRIGGER = "o que fica de coimbra";
const getVariantIndex = (value: unknown) => {
  if (typeof value !== "number" || !Number.isInteger(value)) return 0;
  return value >= 0 && value <= 2 ? value : 0;
};

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


  const muralRef = useRef<HTMLDivElement>(null);
  const scrollToMural = () => muralRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="relative min-h-screen w-full bg-background">
      {/* ============ TOP NAV ============ */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-6 py-5 md:flex-row md:px-10 md:py-6">
          <a href="/" className="text-center text-lg text-ink md:text-left">
            O que fica de <span className="font-serif-display italic">Coimbra</span>
          </a>
          <nav className="flex flex-wrap items-center justify-center gap-4 md:gap-10">
            <button onClick={onBegin} className="text-xs text-ink/80 transition-colors hover:text-ink md:text-sm">
              Postais
            </button>
            <button onClick={scrollToMural} className="text-xs text-ink/80 transition-colors hover:text-ink md:text-sm">
              Mural de memórias
            </button>
            <button className="text-xs text-ink/80 transition-colors hover:text-ink md:text-sm">
              Sobre o projeto
            </button>
            <button
              onClick={() => { reset(); setArmed(true); }}
              className="inline-flex items-center gap-2 rounded-full bg-yellow px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-yellow/90 md:px-5 md:py-2.5 md:text-sm"
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

      {/* ============ POSTCARDS STACK ============ */}
      <section ref={muralRef} className="relative overflow-hidden bg-background px-6 pb-20 pt-2">
        <PostcardsStack />

        <div className="mt-12 flex justify-center">
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

      {/* ============ STACKED CARD (about) ============ */}
      <ScrollStack className="bg-muted/30">
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

// ============ POSTCARDS STACK ============
const PostcardsStack = () => {
  const { postcards, loading } = usePostcards();
  const stackRef = useRef<StackHandle>(null);

  // Fallback to seeds when no approved postcards yet
  const items = useMemo(() => {
    if (postcards.length > 0) {
      return postcards.map((p) => ({
        id: p.id,
        text: p.memory,
        emotion: p.emotion,
        variantIdx: getVariantIndex(p.variant_idx),
        sender: p.sender,
        recipient: p.recipient,
      }));
    }
    return EMOTION_SEEDS.slice(0, 12).map((s, i) => ({
      id: `seed-${i}`,
      text: s.text,
      emotion: s.emotion,
      variantIdx: 0,
      sender: null as string | null,
      recipient: null as string | null,
    }));
  }, [postcards]);

  const renderPostcard = useCallback((item: (typeof items)[number]) => {
    const e = EMOTIONS[item.emotion];
    const v = e.variants[item.variantIdx] ?? e.variants[0];

    return (
      <PostcardFront
        memory={item.text}
        emotionLabel={e.label}
        variant={v}
        className="aspect-[2/1] rounded-[15px] drop-shadow-[0_1px_2px_rgba(12,12,13,0.05)]"
        radiusClassName="rounded-[15px]"
        contentClassName="px-6 py-8 md:p-10"
      />
    );
  }, []);

  const stackCards = useMemo(() => items.map((item) => renderPostcard(item)), [items, renderPostcard]);
  const canNavigate = items.length > 1;
  const showNavigation = items.length > 0;

  if (loading && postcards.length === 0) {
    return <div className="mx-auto h-[260px] w-full max-w-6xl animate-pulse rounded-[15px] bg-muted/40 md:h-[320px]" />;
  }

  return (
    <div className="relative mx-auto flex w-full max-w-6xl justify-center overflow-visible px-8 md:px-14">
      <div className="relative aspect-[2/1] w-full max-w-[1024px]">
        <Stack
          ref={stackRef}
          randomRotation
          sensitivity={180}
          sendToBackOnClick
          mobileClickOnly
          autoplay
          autoplayDelay={3000}
          pauseOnHover
          cards={stackCards}
          animationConfig={{ stiffness: 260, damping: 22 }}
        />
      </div>
      {showNavigation && (
        <>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={!canNavigate}
            onClick={() => canNavigate && stackRef.current?.previous()}
            className="absolute left-3 top-1/2 z-30 h-11 w-11 -translate-y-1/2 rounded-full border-ink/10 bg-card text-ink shadow-[0_2px_12px_rgba(32,27,22,0.14)] backdrop-blur hover:bg-card md:left-6"
            aria-label="Postal anterior"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={!canNavigate}
            onClick={() => canNavigate && stackRef.current?.next()}
            className="absolute right-3 top-1/2 z-30 h-11 w-11 -translate-y-1/2 rounded-full border-ink/10 bg-card text-ink shadow-[0_2px_12px_rgba(32,27,22,0.14)] backdrop-blur hover:bg-card md:right-6"
            aria-label="Postal seguinte"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        </>
      )}
    </div>
  );
};
