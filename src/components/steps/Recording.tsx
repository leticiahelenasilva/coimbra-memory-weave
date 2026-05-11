import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { MicOff } from "lucide-react";
import { Stamp } from "../Stamp";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useMicAmplitude } from "@/hooks/useMicAmplitude";

interface Props {
  onComplete: (memory: string) => void;
}

// Strip the trigger phrase if the recognizer caught it before we mounted
const stripTrigger = (raw: string) => {
  let m = raw.trim();
  const re = /^o que fica de coimbra\s*[ée]?\s*/i;
  while (re.test(m)) m = m.replace(re, "").trim();
  return m;
};

export const Recording = ({ onComplete }: Props) => {
  const { transcript, interim, supported, listening, reset } = useSpeechRecognition({
    enabled: true,
    lang: "pt-PT",
  });
  const { amplitude } = useMicAmplitude(true);
  const [spoken, setSpoken] = useState("");

  // Reset transcript on mount so we start fresh
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build the spoken portion (without the trigger phrase)
  useEffect(() => {
    const combined = (transcript + " " + interim).trim();
    setSpoken(stripTrigger(combined));
  }, [transcript, interim]);

  const handleFinish = () => {
    const finalText = spoken.trim() || "uma memória sem palavras";
    onComplete(finalText);
  };

  const handleRestart = () => {
    reset();
    setSpoken("");
  };

  // Visual reactivity from amplitude
  const fontSize = useMemo(() => 2.4 + amplitude * 4.5, [amplitude]);
  const colorMix = useMemo(() => {
    if (amplitude < 0.15) return "hsl(var(--whisper-blue))";
    if (amplitude < 0.35) return "hsl(var(--ink) / 0.85)";
    if (amplitude < 0.6) return "hsl(var(--ink))";
    return "hsl(var(--yellow))";
  }, [amplitude]);
  const fontWeight = 300 + Math.round(amplitude * 400);
  const letterSpacing = -0.02 + amplitude * 0.04;

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-background px-6 py-10">
      <div className="flex items-center justify-between">
        <Stamp>gravação generativa</Stamp>
        <div className="flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {listening ? (
            <><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" /> a ouvir</>
          ) : (
            <><MicOff className="h-3 w-3" /> microfone parado</>
          )}
        </div>
      </div>

      <div className="relative mx-auto mt-10 grid min-h-[70vh] max-w-5xl place-items-center">
        <motion.div
          key="rec"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
              <span className="italic text-ink/70">O que fica de Coimbra é…</span>{" "}
              {spoken ? (
                <span>{spoken}</span>
              ) : (
                <span className="italic text-muted-foreground/70">fala agora</span>
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
              onClick={handleRestart}
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

          {!supported && (
            <p className="mt-6 text-center font-mono-ui text-[10px] uppercase tracking-[0.2em] text-destructive">
              reconhecimento de voz indisponível · escreve no editor seguinte
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
};
