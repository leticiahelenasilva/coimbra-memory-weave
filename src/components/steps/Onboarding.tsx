import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, Mic } from "lucide-react";
import { Fog } from "../Fog";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { EMOTION_SEEDS } from "@/data/memories";
import { EMOTIONS, type Variant } from "@/data/emotions";
import { ScrollStack, ScrollStackItem } from "../ScrollStack";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { usePostcards } from "@/hooks/usePostcards";
import { PixelCard } from "@/components/PixelCard";
import postalImage from "../../../assets/postal.png";

interface Props {
  onBegin: () => void;
  onVoiceTrigger: () => void;
}

const TRIGGER = "o que fica de coimbra";
const HIGHLIGHT_INK = "hsl(30 10% 12%)";

const parseHsl = (color: string) => {
  const match = color.match(/hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/i);
  if (!match) return null;

  return {
    h: Number(match[1]),
    s: Number(match[2]),
    l: Number(match[3]),
  };
};

const hslToRgb = ({ h, s, l }: { h: number; s: number; l: number }) => {
  const hue = (((h % 360) + 360) % 360) / 360;
  const saturation = s / 100;
  const lightness = l / 100;

  if (saturation === 0) {
    const value = Math.round(lightness * 255);
    return { r: value, g: value, b: value };
  }

  const hueToRgb = (p: number, q: number, t: number) => {
    let adjusted = t;
    if (adjusted < 0) adjusted += 1;
    if (adjusted > 1) adjusted -= 1;
    if (adjusted < 1 / 6) return p + (q - p) * 6 * adjusted;
    if (adjusted < 1 / 2) return q;
    if (adjusted < 2 / 3) return p + (q - p) * (2 / 3 - adjusted) * 6;
    return p;
  };

  const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  return {
    r: Math.round(hueToRgb(p, q, hue + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, hue) * 255),
    b: Math.round(hueToRgb(p, q, hue - 1 / 3) * 255),
  };
};

const relativeLuminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const channels = [r, g, b].map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatHsl = ({ h, s, l }: { h: number; s: number; l: number }) =>
  `hsl(${h} ${s}% ${l}%)`;

const isDarkHsl = (color: string) => {
  const hsl = parseHsl(color);
  if (!hsl) return false;
  return relativeLuminance(hslToRgb(hsl)) < 0.18;
};

const getEmotionPixelColors = (variant: Variant) => {
  const accent = parseHsl(variant.accent);
  const ink = parseHsl(variant.ink);
  if (!accent) return variant.accent;

  if (isDarkHsl(variant.bg)) {
    return [
      formatHsl({ ...accent, s: clamp(accent.s, 55, 100), l: clamp(accent.l + 16, 70, 88) }),
      formatHsl({ ...accent, s: clamp(accent.s, 45, 100), l: clamp(accent.l + 26, 78, 94) }),
      ink ? formatHsl({ ...ink, l: clamp(ink.l + 8, 76, 96) }) : formatHsl({ ...accent, l: 92 }),
    ].join(",");
  }

  return [
    variant.accent,
    formatHsl({ ...accent, l: clamp(accent.l + 18, 64, 88) }),
    ink ? variant.ink : formatHsl({ ...accent, l: clamp(accent.l - 18, 24, 48) }),
  ].join(",");
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

      {/* ============ POSTCARDS CAROUSEL ============ */}
      <section ref={muralRef} className="relative overflow-hidden bg-background px-6 pb-20 pt-2">
        <PostcardsCarousel />

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

// ============ POSTCARDS CAROUSEL ============
const PostcardsCarousel = () => {
  const { postcards, loading } = usePostcards();
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [shortActiveIndex, setShortActiveIndex] = useState(0);

  // Fallback to seeds when no approved postcards yet
  const items = useMemo(() => {
    if (postcards.length > 0) {
      return postcards.map((p) => ({
        id: p.id,
        text: p.memory,
        emotion: p.emotion,
        sender: p.sender,
        recipient: p.recipient,
      }));
    }
    return EMOTION_SEEDS.slice(0, 12).map((s, i) => ({
      id: `seed-${i}`,
      text: s.text,
      emotion: s.emotion,
      sender: null as string | null,
      recipient: null as string | null,
    }));
  }, [postcards]);

  const isShortPostcardList = postcards.length > 0 && items.length <= 2;

  const displayItems = useMemo(() => items.map((item) => ({ ...item, renderId: item.id })), [items]);

  useEffect(() => {
    if (!api) return;

    const updateActiveIndex = () => setActiveIndex(api.selectedScrollSnap());

    updateActiveIndex();
    api.on("select", updateActiveIndex);
    api.on("reInit", updateActiveIndex);

    return () => {
      api.off("select", updateActiveIndex);
      api.off("reInit", updateActiveIndex);
    };
  }, [api]);

  useEffect(() => {
    setShortActiveIndex(0);
  }, [items.length]);

  if (loading && postcards.length === 0) {
    return <div className="mx-auto h-[260px] w-full max-w-6xl animate-pulse rounded-[15px] bg-muted/40 md:h-[320px]" />;
  }

  const renderPostcard = (item: (typeof items)[number]) => {
    const e = EMOTIONS[item.emotion];
    const v = e.variants[0];
    const pixelColors = getEmotionPixelColors(v);
    const isDarkPostcard = isDarkHsl(v.bg);
    const sender = item.sender?.trim() || "anónimo";

    return (
      <PixelCard
        colors={pixelColors}
        gap={isDarkPostcard ? 6 : 10}
        speed={isDarkPostcard ? 35 : 25}
        maxPixelSize={isDarkPostcard ? 3.5 : 2}
        noFocus
        className="aspect-[2/1] rounded-[15px] drop-shadow-[0_1px_2px_rgba(12,12,13,0.05)]"
      >
        <article
          className="relative z-[3] flex h-full w-full flex-col justify-between overflow-hidden rounded-[15px] bg-gradient-to-b from-white to-[#f6f6f6] px-6 py-8 md:py-10"
          style={{ color: v.ink }}
        >
          <p className="font-serif italic text-[clamp(0.8rem,1.5vw,1.5rem)] leading-none text-muted-foreground">
            O que fica de Coimbra é
          </p>
          <p
            className={`line-clamp-3 min-w-full break-words text-[clamp(1.4rem,3.1vw,2.25rem)] leading-none ${v.fontCls}`}
            style={{ color: v.accent }}
          >
            {item.text}
          </p>
          <div className="flex w-full items-center justify-between gap-4">
            <span
              className="inline-flex shrink-0 items-center justify-center rounded-full px-3 py-2 text-sm leading-none"
              style={{ background: v.accent, color: HIGHLIGHT_INK }}
            >
              {e.label}
            </span>
            <span className="truncate text-right text-base leading-none text-muted-foreground">
              &mdash; {sender}
            </span>
          </div>
        </article>
      </PixelCard>
    );
  };

  if (isShortPostcardList) {
    const getItemAtOffset = (offset: number) => {
      const nextIndex = (shortActiveIndex + offset + items.length) % items.length;
      return items[nextIndex];
    };

    const navigateShortList = (direction: 1 | -1) => {
      if (items.length < 2) return;
      setShortActiveIndex((current) => (current + direction + items.length) % items.length);
    };

    return (
      <div className="relative mx-auto max-w-6xl overflow-hidden">
        <div className="flex items-center justify-center gap-5">
          {([-1, 0, 1] as const).map((offset) => (
            <div
              key={`${getItemAtOffset(offset).id}-${offset}-${shortActiveIndex}`}
              className={`shrink-0 basis-[78%] md:basis-[60%] lg:basis-[56%] ${
                offset === 0 ? "scale-100 opacity-100" : "scale-[0.92] opacity-70"
              }`}
            >
              {renderPostcard(getItemAtOffset(offset))}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => navigateShortList(-1)}
          className="absolute left-2 top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full border-ink/10 bg-card/90 shadow-soft backdrop-blur md:left-0"
          aria-label="Postal anterior"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => navigateShortList(1)}
          className="absolute right-2 top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full border-ink/10 bg-card/90 shadow-soft backdrop-blur md:right-0"
          aria-label="Postal seguinte"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Carousel setApi={setApi} opts={{ align: "center", loop: true }} className="mx-auto max-w-6xl">
        <CarouselContent className="-ml-5">
          {displayItems.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <CarouselItem
                key={item.renderId}
                className={`basis-[78%] pl-5 transition-[opacity,transform] duration-500 ease-out md:basis-[60%] lg:basis-[56%] ${
                  isActive ? "scale-100 opacity-100" : "scale-[0.92] opacity-70"
                }`}
              >
                {renderPostcard(item)}
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="left-2 z-10 flex border-ink/10 bg-card/90 shadow-soft backdrop-blur md:-left-12" />
        <CarouselNext className="right-2 z-10 flex border-ink/10 bg-card/90 shadow-soft backdrop-blur md:-right-12" />
      </Carousel>
    </div>
  );
};
