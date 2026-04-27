import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Camera, ChevronDown, Mail, Mic } from "lucide-react";
import { Fog } from "../Fog";
import { Stamp } from "../Stamp";
import { Button } from "@/components/ui/button";
import { SEED_MEMORIES } from "@/data/memories";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useMicAmplitude } from "@/hooks/useMicAmplitude";

interface Props {
  onBegin: () => void;
}

const TRIGGER = "o que fica de coimbra";

// Sample postcards to display in the gallery
const SAMPLE_POSTCARDS = [
  {
    memory: "o cheiro do Mondego ao amanhecer",
    sender: "Inês",
    destination: "para a minha avó",
    bg: "hsl(60 20% 97%)",
    ink: "hsl(30 8% 12%)",
    accent: "hsl(60 100% 50%)",
    palette: "papel · amarelo",
    fontCls: "font-serif italic",
    rotate: -3,
  },
  {
    memory: "uma guitarra a chorar na Sé Velha",
    sender: "Tomás",
    destination: "para quem nunca ouviu fado",
    bg: "hsl(270 45% 92%)",
    ink: "hsl(270 40% 20%)",
    accent: "hsl(270 50% 55%)",
    palette: "lilás · tinta",
    fontCls: "font-serif",
    rotate: 4,
  },
  {
    memory: "primeira queima das fitas",
    sender: "Marta",
    destination: "ao meu eu de 18 anos",
    bg: "hsl(28 45% 92%)",
    ink: "hsl(20 30% 18%)",
    accent: "hsl(14 80% 55%)",
    palette: "tijolo · sol",
    fontCls: "font-serif italic",
    rotate: -2,
  },
  {
    memory: "neblina a subir do rio",
    sender: "anónimo",
    destination: "para quem chegar depois",
    bg: "hsl(220 30% 94%)",
    ink: "hsl(220 40% 18%)",
    accent: "hsl(220 60% 60%)",
    palette: "rio · névoa",
    fontCls: "font-serif",
    rotate: 3,
  },
];

export const Onboarding = ({ onBegin }: Props) => {
  const [voiceArmed, setVoiceArmed] = useState(false);
  const [triggered, setTriggered] = useState(false);

  const { transcript, interim, supported, listening, reset } = useSpeechRecognition({
    enabled: voiceArmed && !triggered,
    lang: "pt-PT",
  });
  const { amplitude } = useMicAmplitude(voiceArmed && !triggered);

  // Detect trigger
  useEffect(() => {
    if (!voiceArmed || triggered) return;
    const all = (transcript + " " + interim).toLowerCase();
    if (all.includes(TRIGGER)) {
      setTriggered(true);
      reset();
      setTimeout(() => onBegin(), 600);
    }
  }, [voiceArmed, triggered, transcript, interim, reset, onBegin]);

  const muralRef = useRef<HTMLDivElement>(null);
  const scrollToMural = () => muralRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="relative w-full bg-background">
      {/* Sticky top bar */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between p-6">
        <Stamp>memorial digital · 2026</Stamp>
        <span className="font-mono-ui text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          coimbra · pt
        </span>
      </div>

      {/* ============ SECTION 1 — HERO + VOICE TRIGGER ============ */}
      <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-6 py-24">
        <Fog />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-12">
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
              Um memorial digital que recolhe vozes de quem viveu, passou ou sonhou esta cidade.
              Cada memória torna-se <span className="highlight-yellow not-italic font-medium text-ink">tipografia</span> —
              e parte como postal pelo vento do Mondego.
            </p>

            {/* Voice trigger card */}
            <div className="mt-10 rounded-3xl border border-border bg-card/60 p-6 backdrop-blur-sm">
              <div className="mb-3 flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                <Mic className="h-3 w-3" /> comando de voz
              </div>
              <p className="font-serif-display text-2xl leading-snug text-ink md:text-3xl">
                diz em voz alta:{" "}
                <span className="font-serif-display italic">"o que fica de Coimbra…"</span>
              </p>

              {voiceArmed && !triggered && (
                <div className="mt-5 flex items-center gap-4">
                  <div className="relative grid h-14 w-14 place-items-center">
                    <span className="absolute inset-0 animate-pulse-ring rounded-full" />
                    <div
                      className="grid h-10 w-10 place-items-center rounded-full bg-yellow"
                      style={{ transform: `scale(${1 + amplitude * 0.5})`, transition: "transform 80ms" }}
                    >
                      <Mic className="h-4 w-4 text-ink" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-serif italic text-ink">à escuta…</p>
                    <p className="mt-0.5 truncate font-mono-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {(transcript + " " + interim).trim() || "—"}
                    </p>
                  </div>
                </div>
              )}

              {triggered && (
                <p className="mt-5 font-serif italic text-ink">
                  <span className="highlight-yellow not-italic">ouvido.</span> a abrir o teu espaço…
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {!voiceArmed ? (
                  <Button
                    onClick={() => setVoiceArmed(true)}
                    size="lg"
                    className="group h-12 rounded-full bg-ink px-6 text-paper hover:bg-ink/90"
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    ativar microfone
                  </Button>
                ) : (
                  <Button
                    onClick={() => { setVoiceArmed(false); reset(); }}
                    variant="ghost"
                    className="h-12 rounded-full px-4 text-muted-foreground"
                  >
                    parar de ouvir
                  </Button>
                )}
                <Button
                  onClick={onBegin}
                  variant="outline"
                  size="lg"
                  className="group h-12 rounded-full border-ink/30 px-6 hover:border-ink"
                >
                  ou começar manualmente
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>

              {!supported && voiceArmed && (
                <p className="mt-4 font-mono-ui text-[10px] uppercase tracking-[0.2em] text-destructive">
                  reconhecimento de voz não suportado · usa o botão manual
                </p>
              )}

              <div className="mt-5 flex items-center gap-3 font-mono-ui text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <span className="flex items-center gap-1.5"><Camera className="h-3.5 w-3.5" /> câmara</span>
                <span className="opacity-40">+</span>
                <span className="flex items-center gap-1.5"><Mic className="h-3.5 w-3.5" /> microfone</span>
                <span className="opacity-40">·</span>
                <span>opcional</span>
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

        {/* Scroll hint */}
        <button
          onClick={scrollToMural}
          className="absolute inset-x-0 bottom-6 mx-auto flex w-fit flex-col items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[0.3em] text-muted-foreground transition hover:text-ink"
        >
          desce para ver as memórias
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </button>
      </section>

      {/* ============ SECTION 2 — LIVING MURAL ============ */}
      <section ref={muralRef} className="relative w-full overflow-hidden border-t border-border/60 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="mb-3 font-mono-ui text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                mural vivo · {SEED_MEMORIES.length} memórias
              </p>
              <h2 className="font-serif-display text-[clamp(2.4rem,5vw,4rem)] font-medium leading-[1] text-ink">
                memórias deixadas<br />
                por <span className="italic">quem passou</span>.
              </h2>
            </div>
            <p className="max-w-md font-serif italic text-muted-foreground">
              Frases sussurradas, gravadas e libertadas. Passa o cursor por cima — algumas
              ainda guardam o calor de quem as disse.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card/30 py-12">
            {/* fade edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />

            {(() => {
              // Split memories into 3 rows, each scrolling at a different speed/direction
              const rows = [0, 1, 2].map((row) =>
                SEED_MEMORIES.filter((_, i) => i % 3 === row)
              );
              const configs = [
                { dir: "left",  dur: "55s", size: 1.7, italic: false },
                { dir: "right", dur: "75s", size: 2.2, italic: true  },
                { dir: "left",  dur: "65s", size: 1.4, italic: false },
              ] as const;

              return (
                <div className="space-y-6">
                  {rows.map((items, rIdx) => {
                    const cfg = configs[rIdx];
                    // Duplicate items so the loop is seamless
                    const loop = [...items, ...items];
                    return (
                      <div
                        key={rIdx}
                        className="marquee-track group relative flex w-full overflow-hidden"
                      >
                        <div
                          className={`marquee-inner flex shrink-0 items-center gap-12 pr-12 ${
                            cfg.dir === "left" ? "animate-marquee-left" : "animate-marquee-right"
                          }`}
                          style={{ ['--marquee-dur' as string]: cfg.dur }}
                        >
                          {loop.map((m, i) => (
                            <span
                              key={`${rIdx}-${i}`}
                              className="memory-item cursor-default whitespace-nowrap text-ink transition-[filter,opacity,color] duration-300"
                              style={{
                                fontFamily: '"Cormorant Garamond", serif',
                                fontStyle: cfg.italic ? "italic" : "normal",
                                fontSize: `${cfg.size}rem`,
                                filter: "blur(4px)",
                                opacity: 0.45,
                              }}
                              onMouseEnter={(e) => {
                                const el = e.currentTarget;
                                el.style.filter = "blur(0px)";
                                el.style.opacity = "1";
                              }}
                              onMouseLeave={(e) => {
                                const el = e.currentTarget;
                                el.style.filter = "blur(4px)";
                                el.style.opacity = "0.45";
                              }}
                            >
                              <span className="hover-highlight">{m}</span>
                              <span className="ml-12 select-none text-muted-foreground/40">·</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div className="mt-12 flex items-center justify-center">
              <Button
                onClick={onBegin}
                size="lg"
                className="group h-12 rounded-full bg-ink px-6 text-paper hover:bg-ink/90"
              >
                deixar a minha memória
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SECTION 3 — SAMPLE POSTCARDS GALLERY ============ */}
      <section className="relative w-full overflow-hidden border-t border-border/60 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="mb-3 font-mono-ui text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                postais gerados · arquivo
              </p>
              <h2 className="font-serif-display text-[clamp(2.4rem,5vw,4rem)] font-medium leading-[1] text-ink">
                cada memória<br />
                vira <span className="italic">postal</span>.
              </h2>
            </div>
            <p className="max-w-md font-serif italic text-muted-foreground">
              Quatro exemplos de postais já enviados — composições tipográficas únicas,
              feitas a partir da voz de quem os deixou.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {SAMPLE_POSTCARDS.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30, rotate: 0 }}
                whileInView={{ opacity: 1, y: 0, rotate: p.rotate }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ rotate: 0, scale: 1.02 }}
                className="paper relative aspect-[7/5] rounded-[1.5rem] p-7"
                style={{ background: p.bg, color: p.ink }}
              >
                <div className="flex items-start justify-between">
                  <div className="font-mono-ui text-[10px] uppercase tracking-[0.25em] opacity-70">
                    postal · coimbra · #{String(i + 1).padStart(3, "0")}
                  </div>
                  <div
                    className="grid h-10 w-10 rotate-6 place-items-center rounded-md font-mono-ui text-[9px] uppercase tracking-widest"
                    style={{ background: p.accent, color: p.ink }}
                  >
                    pt'26
                  </div>
                </div>

                <div className="mt-6">
                  <p className={`${p.fontCls} text-balance leading-[1.05]`} style={{ fontSize: "clamp(1.2rem, 2.4vw, 1.9rem)" }}>
                    <span style={{ color: p.ink, opacity: 0.55 }}>o que fica de Coimbra é</span>{" "}
                    <span style={{ background: `linear-gradient(180deg, transparent 55%, ${p.accent} 55%)`, padding: "0 0.1em" }}>
                      {p.memory}
                    </span>
                    <span style={{ color: p.accent }}>.</span>
                  </p>
                </div>

                <div className="absolute inset-x-7 bottom-6">
                  <div className="ticket-divide h-px opacity-50" />
                  <div className="mt-3 flex items-end justify-between font-mono-ui text-[9px] uppercase tracking-[0.22em]" style={{ opacity: 0.6 }}>
                    <span>de · {p.sender}</span>
                    <span>{p.destination}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SECTION 4 — ABOUT THE PROJECT ============ */}
      <section className="relative w-full overflow-hidden border-t border-border/60 px-6 py-24">
        <Fog intensity={0.5} />

        <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="mb-3 font-mono-ui text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              sobre o projeto
            </p>
            <h2 className="font-serif-display text-[clamp(2.4rem,5vw,4rem)] font-medium leading-[1] text-ink">
              voz, gesto<br />
              e <span className="italic">papel</span>.
            </h2>
          </div>

          <div className="space-y-6 lg:col-span-7">
            <p className="font-serif text-lg leading-relaxed text-ink/85">
              <span className="font-medium text-ink">O que fica de Coimbra</span> é um
              memorial digital interativo que recolhe vozes de quem viveu, passou ou
              sonhou esta cidade. Cada memória é gravada, transformada em tipografia
              generativa e enviada como um postal — para o mural coletivo e para
              quem vier depois.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card/40 p-5 backdrop-blur-sm">
                <Mic className="mb-3 h-5 w-5 text-lilac-deep" />
                <p className="font-mono-ui text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  01 · voz
                </p>
                <p className="mt-1 font-serif italic text-ink">
                  Diz a frase de partida e a tua memória aparece em tempo real.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card/40 p-5 backdrop-blur-sm">
                <Camera className="mb-3 h-5 w-5 text-lilac-deep" />
                <p className="font-mono-ui text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  02 · gesto
                </p>
                <p className="mt-1 font-serif italic text-ink">
                  Aproxima-te, desliza, escolhe paleta e tipografia com as mãos.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card/40 p-5 backdrop-blur-sm">
                <Mail className="mb-3 h-5 w-5 text-lilac-deep" />
                <p className="font-mono-ui text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  03 · papel
                </p>
                <p className="mt-1 font-serif italic text-ink">
                  Recebe o teu postal único — para guardar ou enviar a alguém.
                </p>
              </div>
            </div>

            <p className="font-serif italic text-muted-foreground">
              Uma colaboração entre voz, gesto e papel. Sem cookies, sem perfis —
              apenas memórias que ficam.
            </p>

            <div className="pt-4">
              <Button
                onClick={onBegin}
                size="lg"
                className="group h-14 rounded-full bg-ink px-8 text-paper hover:bg-ink/90"
              >
                começar a recordar
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-20 max-w-6xl border-t border-border/60 pt-6">
          <p className="text-center font-mono-ui text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            coimbra · 2026 · feito com fado e código
          </p>
        </div>
      </section>
    </div>
  );
};
