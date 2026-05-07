import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, Download, Hand, Mail, Send, Sparkles } from "lucide-react";
import { toPng } from "html-to-image";
import { Stamp } from "../Stamp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useHandSwipe } from "@/hooks/useHandSwipe";
import { toast } from "sonner";
import { detectEmotion, Variant } from "@/data/emotions";

// Strip the trigger phrase if it leaked into the captured memory
const cleanMemory = (raw: string) => {
  let m = raw.trim();
  const re = /^o que fica de coimbra\s*[ée]\s*/i;
  while (re.test(m)) m = m.replace(re, "").trim();
  return m;
};

interface Props {
  memory: string;
  onSend: () => void;
}

export const Editor = ({ memory, onSend }: Props) => {
  const cleanedMemory = useMemo(() => cleanMemory(memory), [memory]);
  const emotion = useMemo(() => detectEmotion(cleanedMemory), [cleanedMemory]);
  const variants = emotion.variants;

  const [variantIdx, setVariantIdx] = useState(0);
  const [flying, setFlying] = useState(false);
  const [sender, setSender] = useState("anónimo");
  const [destination, setDestination] = useState("quem ler depois de mim");
  const [swipeHint, setSwipeHint] = useState<"left" | "right" | null>(null);
  const postcardRef = useRef<HTMLDivElement>(null);

  const variant: Variant = variants[variantIdx];

  // Voice command "enviar"
  const { transcript, interim } = useSpeechRecognition({ enabled: !flying, lang: "pt-PT" });
  useEffect(() => {
    const all = (transcript + " " + interim).toLowerCase();
    if (all.includes("enviar") && !flying) handleSend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, interim, flying]);

  const cycle = (dir: 1 | -1) => {
    setSwipeHint(dir === 1 ? "right" : "left");
    setVariantIdx((i) => (i + dir + variants.length) % variants.length);
    window.setTimeout(() => setSwipeHint(null), 350);
  };

  // Keyboard arrows = mock hand swipes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (flying) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight") cycle(1);
      if (e.key === "ArrowLeft") cycle(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flying]);

  // Hand swipe via webcam (mocked CV)
  const { status: camStatus, motion: camMotion } = useHandSwipe({
    enabled: !flying,
    onSwipe: (dir) => cycle(dir === "right" ? 1 : -1),
  });

  const handleSend = () => {
    setFlying(true);
    setTimeout(() => onSend(), 1500);
  };

  const handleDownload = async () => {
    if (!postcardRef.current) return;
    try {
      const dataUrl = await toPng(postcardRef.current, {
        pixelRatio: 2,
        backgroundColor: variant.bg,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `postal-coimbra-${emotion.key}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("postal guardado no computador");
    } catch (err) {
      console.error(err);
      toast.error("não foi possível gerar o png");
    }
  };

  const handleEmail = () => {
    const subject = encodeURIComponent("um postal de Coimbra para ti");
    const body = encodeURIComponent(
      `o que fica de Coimbra é ${cleanedMemory}.\n\n— ${sender || "anónimo"}\npara ${destination || "quem ler depois de mim"}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-background px-6 py-8">
      <div className="flex items-center justify-between">
        <Stamp>passo 04 · editor gestual</Stamp>
        <span className="font-mono-ui text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          diz <span className="text-ink">"enviar"</span> para partir
        </span>
      </div>

      <div className="mx-auto mt-6 grid w-full max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-12">
        {/* Postcard */}
        <div className="lg:col-span-8">
          <div className="relative">
            {/* Swipe hint arrows */}
            <button
              onClick={() => cycle(-1)}
              aria-label="opção anterior"
              className="absolute left-0 top-1/2 z-10 -translate-x-2 -translate-y-1/2 rounded-full border border-border bg-card/70 p-3 backdrop-blur transition hover:scale-110 hover:bg-card"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => cycle(1)}
              aria-label="opção seguinte"
              className="absolute right-0 top-1/2 z-10 translate-x-2 -translate-y-1/2 rounded-full border border-border bg-card/70 p-3 backdrop-blur transition hover:scale-110 hover:bg-card"
            >
              <ArrowRight className="h-5 w-5" />
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                ref={postcardRef}
                key={variantIdx}
                initial={{ opacity: 0, x: swipeHint === "right" ? 60 : swipeHint === "left" ? -60 : 0 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: swipeHint === "right" ? -60 : 60 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className={`paper relative mx-auto aspect-[7/5] w-full max-w-3xl rounded-[2rem] p-10 ${flying ? "animate-fly-away" : ""}`}
                style={{ background: variant.bg, color: variant.ink }}
              >
                <div className="flex items-start justify-between">
                  <div className="font-mono-ui text-[10px] uppercase tracking-[0.25em] opacity-70">
                    postal · coimbra · {emotion.label}
                  </div>
                  <div
                    className="grid h-14 w-14 rotate-6 place-items-center rounded-md font-mono-ui text-[10px] uppercase tracking-widest"
                    style={{ background: variant.accent, color: variant.ink }}
                  >
                    pt'26
                  </div>
                </div>

                <div className="mt-8 grid h-[70%] grid-cols-12 gap-6">
                  <div className="col-span-12 md:col-span-8">
                    <p className={`${variant.fontCls} text-balance leading-[1.05]`} style={{ fontSize: "clamp(1.6rem, 3.6vw, 3rem)" }}>
                      <span style={{ opacity: 0.55 }}>o que fica de Coimbra é</span>{" "}
                      <span style={{ background: `linear-gradient(180deg, transparent 55%, ${variant.accent} 55%)`, padding: "0 0.1em" }}>
                        {cleanedMemory}
                      </span>
                      <span style={{ color: variant.accent }}>.</span>
                    </p>
                  </div>
                  <div className="col-span-12 hidden md:col-span-4 md:block">
                    <div className="ticket-divide mb-3 h-px" />
                    <div className="font-mono-ui text-[10px] uppercase tracking-[0.2em] opacity-70">
                      remetente
                    </div>
                    <p className="font-serif italic" style={{ fontSize: "1.1rem" }}>{sender || "anónimo"}</p>
                    <div className="mt-4 font-mono-ui text-[10px] uppercase tracking-[0.2em] opacity-70">
                      destino
                    </div>
                    <p className="font-serif italic" style={{ fontSize: "1.1rem" }}>{destination || "quem ler depois de mim"}</p>
                  </div>
                </div>

                <div className="absolute inset-x-10 bottom-8 flex items-end justify-between font-mono-ui text-[10px] uppercase tracking-[0.22em]" style={{ opacity: 0.6 }}>
                  <span>{variant.name}</span>
                  <span>{variant.fontLabel}</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Variant indicator dots */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {variants.map((v, i) => (
              <button
                key={i}
                onClick={() => setVariantIdx(i)}
                className={`h-2.5 rounded-full transition-all ${i === variantIdx ? "w-8 bg-ink" : "w-2.5 bg-ink/25"}`}
                aria-label={`opção ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="lg:col-span-4">
          <div className="rounded-3xl border border-border bg-card/60 p-6 backdrop-blur">
            <div className="mb-1 flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> emoção detetada
            </div>
            <p className="mb-1 font-serif text-2xl text-ink">{emotion.label}</p>
            <p className="mb-5 font-serif italic text-sm text-muted-foreground">
              A tua frase foi lida e traduzida em três postais possíveis. Escolhe um deles.
            </p>

            <div className="ticket-divide mb-4 h-px" />

            <div className="mb-4">
              <div className="mb-2 flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[0.22em] text-ink">
                <Hand className="h-3.5 w-3.5" /> gesto · escolher
              </div>
              <p className="font-mono-ui text-[11px] leading-relaxed text-muted-foreground">
                Passa a mão para o lado do postal — esquerda ou direita — para ciclar entre as 3 opções geradas.
                <br />
                <span className="text-ink">← →</span> simulam o gesto.
              </p>

              <div className="mt-3 flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[0.22em]">
                <Camera className="h-3 w-3" />
                {camStatus === "idle" && <span className="text-muted-foreground">a iniciar câmara…</span>}
                {camStatus === "requesting" && <span className="text-muted-foreground">a pedir permissão…</span>}
                {camStatus === "granted" && <span className="text-ink">câmara ativa</span>}
                {camStatus === "denied" && <span className="text-destructive">sem câmara · usa ← →</span>}
                {camStatus === "unsupported" && <span className="text-destructive">câmara indisponível</span>}
              </div>

              {camStatus === "granted" && (
                <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                  <div className="h-full bg-ink/60 transition-all" style={{ width: `${Math.min(100, camMotion.left * 600)}%` }} />
                  <div className="ml-auto h-full bg-ink/60 transition-all" style={{ width: `${Math.min(100, camMotion.right * 600)}%` }} />
                </div>
              )}

              <p className="mt-2 font-mono-ui text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                opção {variantIdx + 1} / {variants.length}
              </p>
            </div>

            <div className="ticket-divide my-5 h-px" />

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block font-mono-ui text-[10px] uppercase tracking-[0.22em] text-ink">
                  remetente
                </label>
                <Input
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  placeholder="anónimo"
                  maxLength={40}
                  className="h-10 rounded-xl font-serif italic"
                />
              </div>
              <div>
                <label className="mb-1.5 block font-mono-ui text-[10px] uppercase tracking-[0.22em] text-ink">
                  destino
                </label>
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="quem ler depois de mim"
                  maxLength={50}
                  className="h-10 rounded-xl font-serif italic"
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button onClick={handleDownload} disabled={flying} variant="outline" className="h-11 rounded-full border-ink/20 hover:border-ink">
                <Download className="mr-1.5 h-4 w-4" />
                guardar png
              </Button>
              <Button onClick={handleEmail} disabled={flying} variant="outline" className="h-11 rounded-full border-ink/20 hover:border-ink">
                <Mail className="mr-1.5 h-4 w-4" />
                enviar email
              </Button>
            </div>

            <Button
              onClick={handleSend}
              disabled={flying}
              size="lg"
              className="mt-3 h-14 w-full rounded-full bg-ink text-paper hover:bg-ink/90"
            >
              <Send className="mr-2 h-4 w-4" />
              enviar para o mural
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
