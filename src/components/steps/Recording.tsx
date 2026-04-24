import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Stamp } from "../Stamp";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useMicAmplitude } from "@/hooks/useMicAmplitude";

interface Props {
  onComplete: (memory: string) => void;
}

const TRIGGER = "o que fica de coimbra é";

export const Recording = ({ onComplete }: Props) => {
  const [armed, setArmed] = useState(false); // listening for trigger
  const [recording, setRecording] = useState(false); // capturing the memory
  const [memory, setMemory] = useState("");

  const { transcript, interim, supported, listening, reset } = useSpeechRecognition({
    enabled: armed || recording,
    lang: "pt-PT",
  });
  const { amplitude } = useMicAmplitude(armed || recording);

  // Detect trigger phrase
  useEffect(() => {
    if (!armed || recording) return;
    const all = (transcript + " " + interim).toLowerCase();
    if (all.includes(TRIGGER)) {
      reset();
      setRecording(true);
    }
  }, [armed, recording, transcript, interim, reset]);

  // Update displayed memory in real-time while recording
  useEffect(() => {
    if (recording) {
      setMemory((transcript + " " + interim).trim());
    }
  }, [recording, transcript, interim]);

  const handleManualStart = () => {
    reset();
    setArmed(false);
    setRecording(true);
  };

  const handleFinish = () => {
    const finalText = memory.trim() || "uma memória sem palavras";
    onComplete(finalText);
  };

  // Visual reactivity from amplitude
  const fontSize = useMemo(() => {
    const base = 2.4; // rem
    return base + amplitude * 4.5;
  }, [amplitude]);

  const colorMix = useMemo(() => {
    // quiet => whisper-blue, loud => yellow
    if (amplitude < 0.15) return "hsl(var(--whisper-blue))";
    if (amplitude < 0.35) return "hsl(var(--ink) / 0.85)";
    if (amplitude < 0.6) return "hsl(var(--ink))";
    return "hsl(var(--yellow))";
  }, [amplitude]);

  const fontWeight = 300 + Math.round(amplitude * 400);
  const letterSpacing = -0.02 + amplitude * 0.04;

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-background px-6 py-10">
      {/* Top */}
      <div className="flex items-center justify-between">
        <Stamp>passo 03 · gravação generativa</Stamp>
        <div className="flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {listening ? (
            <><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" /> a ouvir</>
          ) : (
            <><MicOff className="h-3 w-3" /> microfone parado</>
          )}
        </div>
      </div>

      {/* Center stage */}
      <div className="relative mx-auto mt-10 grid min-h-[70vh] max-w-5xl place-items-center">
        <AnimatePresence mode="wait">
          {!armed && !recording && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="text-center"
            >
              <p className="mb-6 font-mono-ui text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                quando estiveres pronto
              </p>
              <h2 className="font-serif-display text-5xl italic leading-tight text-ink md:text-6xl">
                diz em voz alta:
              </h2>
              <p className="mt-6 font-serif-display text-3xl leading-snug text-ink md:text-4xl">
                "o que fica de Coimbra <span className="highlight-yellow">é</span>…"
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={() => { reset(); setArmed(true); }}
                  size="lg"
                  className="h-14 rounded-full bg-ink px-8 text-paper hover:bg-ink/90"
                >
                  <Mic className="mr-2 h-4 w-4" />
                  ativar microfone
                </Button>
                <Button
                  onClick={handleManualStart}
                  variant="ghost"
                  className="h-14 rounded-full px-6 text-muted-foreground hover:text-ink"
                >
                  ou começar agora
                </Button>
              </div>

              {!supported && (
                <p className="mt-6 font-mono-ui text-[10px] uppercase tracking-[0.2em] text-destructive">
                  reconhecimento de voz não suportado · usa o botão "começar agora"
                </p>
              )}
            </motion.div>
          )}

          {armed && !recording && (
            <motion.div
              key="armed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="relative mx-auto mb-8 grid h-28 w-28 place-items-center">
                <span className="absolute inset-0 animate-pulse-ring rounded-full" />
                <div
                  className="grid h-20 w-20 place-items-center rounded-full bg-yellow"
                  style={{ transform: `scale(${1 + amplitude * 0.4})`, transition: "transform 80ms" }}
                >
                  <Mic className="h-7 w-7 text-ink" />
                </div>
              </div>
              <p className="font-serif-display text-3xl italic text-ink">à escuta…</p>
              <p className="mt-3 font-mono-ui text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                diz a frase de partida para começar
              </p>
              <Button
                onClick={handleManualStart}
                variant="ghost"
                className="mt-6 rounded-full text-xs text-muted-foreground"
              >
                saltar e começar a gravar
              </Button>
            </motion.div>
          )}

          {recording && (
            <motion.div
              key="rec"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <div className="mb-8 flex items-center justify-center gap-3">
                <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
                <span className="font-mono-ui text-[11px] uppercase tracking-[0.3em] text-destructive">
                  a gravar
                </span>
              </div>

              <div className="min-h-[40vh] px-4 text-center">
                <p
                  className="font-serif-display leading-[1.05] transition-[font-size,color,font-weight,letter-spacing] duration-100 text-balance"
                  style={{
                    fontSize: `${fontSize}rem`,
                    color: colorMix,
                    fontWeight,
                    letterSpacing: `${letterSpacing}em`,
                  }}
                >
                  {memory || (
                    <span className="italic text-muted-foreground">a tua memória aparece aqui…</span>
                  )}
                </p>
              </div>

              {/* Amplitude bar */}
              <div className="mx-auto mt-8 flex h-12 w-full max-w-md items-end gap-1">
                {Array.from({ length: 32 }).map((_, i) => {
                  const seed = (i / 32) * Math.PI * 2;
                  const local = Math.max(0.1, amplitude * (0.5 + 0.5 * Math.sin(seed + amplitude * 8)));
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-ink/70"
                      style={{ height: `${local * 100}%` }}
                    />
                  );
                })}
              </div>

              <div className="mt-10 flex items-center justify-center gap-3">
                <Button
                  onClick={() => { setRecording(false); setArmed(false); reset(); setMemory(""); }}
                  variant="ghost"
                  className="rounded-full text-muted-foreground"
                >
                  recomeçar
                </Button>
                <Button
                  onClick={handleFinish}
                  size="lg"
                  className="h-14 rounded-full bg-ink px-8 text-paper hover:bg-ink/90"
                >
                  guardar memória
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
