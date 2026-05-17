import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Download, Mail, Send } from "lucide-react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useHandSwipe } from "@/hooks/useHandSwipe";
import { toast } from "sonner";
import { detectEmotion, EMOTIONS, EmotionKey, Variant } from "@/data/emotions";
import { PostcardFront } from "@/components/PostcardFront";
import { HIGHLIGHT_INK, hslToRgb, parseHsl, relativeLuminance } from "@/lib/postcardStyle";
import { supabase } from "@/integrations/supabase/client";


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
  initialEmotion?: EmotionKey;
}

const WHITE_RGB = { r: 255, g: 255, b: 255 };
const AA_CONTRAST_RATIO = 4.5;

const contrastRatio = (a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) => {
  const lighter = Math.max(relativeLuminance(a), relativeLuminance(b));
  const darker = Math.min(relativeLuminance(a), relativeLuminance(b));
  return (lighter + 0.05) / (darker + 0.05);
};

const getAaTextColorOnWhite = (accent: string) => {
  const hsl = parseHsl(accent);
  if (!hsl) return HIGHLIGHT_INK;

  if (contrastRatio(hslToRgb(hsl), WHITE_RGB) >= AA_CONTRAST_RATIO) {
    return accent;
  }

  for (let lightness = Math.floor(hsl.l) - 1; lightness >= 0; lightness -= 1) {
    const candidate = { ...hsl, l: lightness };
    if (contrastRatio(hslToRgb(candidate), WHITE_RGB) >= AA_CONTRAST_RATIO) {
      return `hsl(${hsl.h} ${hsl.s}% ${lightness}%)`;
    }
  }

  return HIGHLIGHT_INK;
};

export const Editor = ({ memory, onSend, initialEmotion }: Props) => {
  const initialClean = useMemo(() => cleanMemory(memory), [memory]);
  const [editedMemory, setEditedMemory] = useState(initialClean);
  const cleanedMemory = editedMemory;

  // Emotion is locked once detected (passed in from Analyzing step). Fallback to heuristic.
  const heuristic = useMemo(() => detectEmotion(initialClean), [initialClean]);
  const [emotionKey] = useState<EmotionKey>(initialEmotion ?? heuristic.key);
  const emotion = EMOTIONS[emotionKey];
  const variants = emotion.variants;

  const [variantIdx, setVariantIdx] = useState(0);
  const [flying, setFlying] = useState(false);
  const [sender, setSender] = useState("anónimo");
  const [destination, setDestination] = useState("quem ler depois de mim");
  const [swipeHint, setSwipeHint] = useState<"left" | "right" | null>(null);
  const [flipped, setFlipped] = useState(false);
  const postcardRef = useRef<HTMLDivElement>(null);

  const variant: Variant = variants[variantIdx];
  const emotionTextColor = useMemo(() => getAaTextColorOnWhite(variant.accent), [variant.accent]);

  // Emotion is locked from Analyzing step — no auto re-detection here.


  // Voice command: variants of "enviar para o mural"
  const { transcript, interim, listening } = useSpeechRecognition({ enabled: !flying, lang: "pt-PT" });
  useEffect(() => {
    const all = (transcript + " " + interim).toLowerCase();
    // accepts: enviar/envia/manda/mandar + (para|pro|p'ro) + (o)? + mural
    const re = /(envi[ae]r?|mand[ae]r?)\s+(para|pra|pro|p'ro)\s+(o\s+)?mural/;
    if (re.test(all) && !flying) handleSend();
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
  useHandSwipe({
    enabled: !flying,
    onSwipe: (dir) => cycle(dir === "right" ? 1 : -1),
  });

  const handleSend = () => {
    setFlying(true);
    // Fire-and-forget submission to the backend (moderation queue).
    // We don't block the flying animation on the network round-trip.
    supabase.functions
      .invoke("submit-postcard", {
        body: {
          memory: cleanedMemory,
          sender: sender && sender !== "anónimo" ? sender : null,
          recipient: destination && destination !== "quem ler depois de mim" ? destination : null,
          emotion: emotionKey,
          variant_idx: variantIdx,
        },
      })
      .catch((e) => console.error("[Editor] submit-postcard failed", e));
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
        <span />
        <span className="font-mono-ui text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          clica no postal para editar · diz <span className="text-ink">"enviar para o mural"</span> para partir
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
              className="absolute left-0 top-1/2 z-10 -translate-x-2 -translate-y-1/2 rounded-full bg-card p-3 transition-colors hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => cycle(1)}
              aria-label="opção seguinte"
              className="absolute right-0 top-1/2 z-10 translate-x-2 -translate-y-1/2 rounded-full bg-card p-3 transition-colors hover:bg-muted"
            >
              <ArrowRight className="h-5 w-5" />
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={variantIdx}
                initial={{ opacity: 0, x: swipeHint === "right" ? 60 : swipeHint === "left" ? -60 : 0 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: swipeHint === "right" ? -60 : 60 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => {
                  // Don't flip when interacting with editable text
                  const t = e.target as HTMLElement;
                  if (t.isContentEditable || t.closest('[contenteditable="true"]')) return;
                  if (flying) return;
                  setFlipped((v) => !v);
                }}
                className={`flip-card relative mx-auto aspect-[7/5] w-full max-w-3xl cursor-pointer ${flipped ? "is-flipped" : ""} ${flying ? "animate-fly-away" : ""}`}
              >
                <div className="flip-inner">
                  {/* FRONT */}
                  <PostcardFront
                    memory={cleanedMemory}
                    emotionLabel={emotion.label}
                    variant={variant}
                    editable={!flying}
                    showEditHint
                    postcardRef={postcardRef}
                    onMemoryChange={(nextMemory) => setEditedMemory(nextMemory)}
                    onMemoryKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        (e.target as HTMLElement).blur();
                      }
                    }}
                    className="flip-face rounded-[2rem]"
                  />

                  {/* BACK */}
                  <div
                    className="flip-face flip-back paper rounded-[2rem] p-10"
                    style={{ background: "hsl(60 20% 97%)", color: "hsl(30 8% 12%)" }}
                  >
                    <div className="grid h-full grid-cols-2 gap-8">
                      {/* left: handwritten note */}
                      <div className="flex flex-col">
                        <p className="font-serif italic" style={{ fontSize: "1.6rem", color: variant.accent }}>
                          O que fica de Coimbra é…
                        </p>
                        <p
                          contentEditable={!flying}
                          suppressContentEditableWarning
                          onBlur={(e) => setEditedMemory(e.currentTarget.textContent?.trim() || "")}
                          spellCheck={false}
                          className="mt-4 rounded-sm font-serif text-[0.95rem] leading-relaxed text-ink/80 outline-none focus:ring-2"
                        >
                          {cleanedMemory}
                        </p>
                        <p className="mt-auto font-serif italic text-sm text-ink/60">
                          — <span
                            contentEditable={!flying}
                            suppressContentEditableWarning
                            onBlur={(e) => setSender(e.currentTarget.textContent?.trim() || "anónimo")}
                            spellCheck={false}
                            className="rounded-sm outline-none focus:ring-2"
                          >{sender || "anónimo"}</span>
                        </p>
                      </div>
                      {/* right: address + stamp */}
                      <div className="relative flex flex-col">
                        <div
                          className="ml-auto h-16 w-12 rounded-sm border border-dashed"
                          style={{ background: variant.accent, borderColor: "hsl(30 8% 12% / 0.2)" }}
                        />
                        <div className="mt-12 space-y-3">
                          <div className="font-mono-ui text-[10px] uppercase tracking-[0.2em] opacity-50">para</div>
                          <p
                            contentEditable={!flying}
                            suppressContentEditableWarning
                            onBlur={(e) => setDestination(e.currentTarget.textContent?.trim() || "quem ler depois de mim")}
                            spellCheck={false}
                            className="border-b border-ink/30 pb-1 font-serif text-sm outline-none focus:ring-2"
                          >{destination || "quem ler depois de mim"}</p>

                          <p className="border-b border-ink/30 pb-1 font-serif text-sm">Coimbra · 3000</p>
                          <p className="border-b border-ink/30 pb-1 font-serif text-sm">Portugal</p>
                          <p className="border-b border-ink/30 pb-1 font-serif text-sm">&nbsp;</p>
                        </div>
                        <div className="mt-auto font-mono-ui text-[9px] uppercase tracking-[0.22em] opacity-50">
                          memorial · {emotion.label}
                        </div>
                      </div>
                    </div>
                  </div>
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
          <div className="overflow-hidden rounded-[24px] bg-white">
            <div className="flex items-center justify-between border-b border-ink/5 px-6 pb-3 pt-6">
              <span className="text-base font-normal leading-[1.4] text-muted-foreground">sentimento</span>
              <span
                className="flex items-center justify-end gap-2 text-base font-semibold italic leading-[1.4]"
                style={{ color: emotionTextColor }}
              >
                <span className="relative grid h-2 w-2 place-items-center" aria-hidden>
                  <span
                    className="absolute -inset-1 rounded-full animate-emotion-pulse-halo"
                    style={{ background: variant.accent }}
                  />
                  <span
                    className="relative h-2 w-2 rounded-full"
                    style={{ background: variant.accent }}
                  />
                </span>
                {emotion.label}
              </span>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                <div>
                  <label className="mb-2 block text-base font-normal leading-[1.4] text-ink">Remetente</label>
                  <Input
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    placeholder="anónimo"
                    maxLength={40}
                    className="h-14 rounded-[16px] border-[#d9d9d9] bg-white px-4 text-base text-ink shadow-none md:text-base"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-base font-normal leading-[1.4] text-ink">Destino</label>
                  <Input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="quem ler depois de mim"
                    maxLength={50}
                    className="h-14 rounded-[16px] border-[#d9d9d9] bg-white px-4 text-base text-ink shadow-none md:text-base"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Button onClick={handleDownload} disabled={flying} variant="secondary" className="h-12 w-full justify-center rounded-full bg-[#e3e3e3] px-4 text-base font-normal text-ink hover:bg-[#d9d9d9]">
                  Salvar como imagem
                  <Download className="ml-0 h-4 w-4" />
                </Button>
                <Button onClick={handleEmail} disabled={flying} variant="secondary" className="h-12 w-full justify-center rounded-full bg-[#e3e3e3] px-4 text-base font-normal text-ink hover:bg-[#d9d9d9]">
                  Enviar por e-mail
                  <Mail className="ml-0 h-4 w-4" />
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={flying}
                  size="lg"
                  className="h-12 w-full rounded-full bg-ink px-4 text-base font-normal text-paper hover:bg-ink/90"
                >
                  Enviar para o mural
                  <Send className="ml-0 h-4 w-4" />
                </Button>
              </div>

              <div className="mt-3 space-y-8">
                <div className="flex items-center justify-center text-sm leading-[1.4] text-[#b3b3b3]">
                  <span className="h-px flex-1 bg-[#d9d9d9]" />
                  <span className="px-4">ou fale</span>
                  <span className="h-px flex-1 bg-[#d9d9d9]" />
                </div>
                <div className="flex items-center justify-center gap-2 text-sm leading-[1.4] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  <span>”Enviar para o mural”</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
