import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Download, Hand, Mail, Send, Type } from "lucide-react";
import { toPng } from "html-to-image";
import { Stamp } from "../Stamp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { toast } from "sonner";

interface Props {
  memory: string;
  onSend: (palette: Palette, fontKey: FontKey) => void;
}

export type Palette = {
  name: string;
  bg: string;
  ink: string;
  accent: string;
};

export type FontKey = "serif" | "italic" | "mono" | "sans";

const PALETTES: Palette[] = [
  { name: "papel · amarelo", bg: "hsl(60 20% 97%)", ink: "hsl(30 8% 12%)", accent: "hsl(60 100% 50%)" },
  { name: "lilás · tinta", bg: "hsl(270 45% 92%)", ink: "hsl(270 40% 20%)", accent: "hsl(270 50% 55%)" },
  { name: "rio · névoa",   bg: "hsl(220 30% 94%)", ink: "hsl(220 40% 18%)", accent: "hsl(220 60% 60%)" },
  { name: "tijolo · sol",  bg: "hsl(28 45% 92%)",  ink: "hsl(20 30% 18%)",  accent: "hsl(14 80% 55%)" },
  { name: "noite · fado",  bg: "hsl(30 10% 14%)",  ink: "hsl(50 20% 92%)",  accent: "hsl(50 95% 60%)" },
];

const FONTS: { key: FontKey; label: string; cls: string; italic?: boolean }[] = [
  { key: "serif",  label: "serif clássico", cls: "font-serif" },
  { key: "italic", label: "serif itálico",  cls: "font-serif italic", italic: true },
  { key: "mono",   label: "mono editorial", cls: "font-mono" },
  { key: "sans",   label: "sans moderno",   cls: "font-sans" },
];

export const Editor = ({ memory, onSend }: Props) => {
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [fontIdx, setFontIdx] = useState(0);
  const [flying, setFlying] = useState(false);
  const [sender, setSender] = useState("anónimo");
  const [destination, setDestination] = useState("quem ler depois de mim");
  const postcardRef = useRef<HTMLDivElement>(null);

  const palette = PALETTES[paletteIdx];
  const font = FONTS[fontIdx];

  // Voice command "enviar"
  const { transcript, interim } = useSpeechRecognition({ enabled: !flying, lang: "pt-PT" });
  useEffect(() => {
    const all = (transcript + " " + interim).toLowerCase();
    if (all.includes("enviar") && !flying) {
      handleSend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, interim, flying]);

  // Keyboard arrows mock hand-swipes (skip when typing in inputs)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (flying) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight") setPaletteIdx((i) => (i + 1) % PALETTES.length);
      if (e.key === "ArrowLeft")  setFontIdx((i) => (i + 1) % FONTS.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flying]);

  const handleSend = () => {
    setFlying(true);
    setTimeout(() => onSend(palette, font.key), 1500);
  };

  const handleDownload = async () => {
    if (!postcardRef.current) return;
    try {
      const dataUrl = await toPng(postcardRef.current, {
        pixelRatio: 2,
        backgroundColor: palette.bg,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `postal-coimbra-${Date.now()}.png`;
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
      `o que fica de Coimbra é ${memory}.\n\n— ${sender || "anónimo"}\npara ${destination || "quem ler depois de mim"}\n\n(podes guardar a imagem do postal a partir da app — botão "guardar png")`
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
          <motion.div
            ref={postcardRef}
            key={`${paletteIdx}-${fontIdx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`paper relative mx-auto aspect-[7/5] w-full max-w-3xl rounded-[2rem] p-10 ${flying ? "animate-fly-away" : ""}`}
            style={{ background: palette.bg, color: palette.ink }}
          >
            <div className="flex items-start justify-between">
              <div className="font-mono-ui text-[10px] uppercase tracking-[0.25em] opacity-70">
                postal · coimbra
              </div>
              <div
                className="grid h-14 w-14 rotate-6 place-items-center rounded-md font-mono-ui text-[10px] uppercase tracking-widest"
                style={{ background: palette.accent, color: palette.ink }}
              >
                pt'26
              </div>
            </div>

            <div className="mt-8 grid h-[70%] grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-8">
                <p className={`${font.cls} text-balance leading-[1.05]`} style={{ fontSize: "clamp(1.6rem, 3.6vw, 3rem)" }}>
                  <span style={{ color: palette.ink, opacity: 0.55 }}>o que fica de Coimbra é</span>{" "}
                  <span style={{ background: `linear-gradient(180deg, transparent 55%, ${palette.accent} 55%)`, padding: "0 0.1em" }}>
                    {memory}
                  </span>
                  <span style={{ color: palette.accent }}>.</span>
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
              <span>{palette.name}</span>
              <span>{font.label}</span>
            </div>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="lg:col-span-4">
          <div className="rounded-3xl border border-border bg-card/60 p-6 backdrop-blur">
            <div className="mb-1 flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              <Hand className="h-3.5 w-3.5" /> gestos simulados
            </div>
            <p className="mb-5 font-serif italic text-muted-foreground">
              Usa as setas — ou desliza com a mão na versão completa.
            </p>

            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono-ui text-[10px] uppercase tracking-[0.22em] text-ink">paleta</span>
                  <span className="font-mono-ui text-[10px] text-muted-foreground">
                    {paletteIdx + 1}/{PALETTES.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setPaletteIdx((i) => (i - 1 + PALETTES.length) % PALETTES.length)}
                    className="h-9 w-9 rounded-full"
                    aria-label="paleta anterior"
                  ><ArrowLeft className="h-4 w-4" /></Button>
                  <div className="flex flex-1 items-center justify-center gap-1.5">
                    {PALETTES.map((p, i) => (
                      <button
                        key={p.name}
                        onClick={() => setPaletteIdx(i)}
                        className={`h-6 w-6 rounded-full border transition ${i === paletteIdx ? "scale-110 border-ink" : "border-border opacity-70"}`}
                        style={{ background: p.accent }}
                        aria-label={p.name}
                      />
                    ))}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setPaletteIdx((i) => (i + 1) % PALETTES.length)}
                    className="h-9 w-9 rounded-full"
                    aria-label="paleta seguinte"
                  ><ArrowRight className="h-4 w-4" /></Button>
                </div>
                <p className="mt-2 font-mono-ui text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  → seta direita
                </p>
              </div>

              <div className="ticket-divide h-px" />

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-mono-ui text-[10px] uppercase tracking-[0.22em] text-ink">
                    <Type className="h-3 w-3" /> tipografia
                  </span>
                  <span className="font-mono-ui text-[10px] text-muted-foreground">
                    {fontIdx + 1}/{FONTS.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {FONTS.map((f, i) => (
                    <button
                      key={f.key}
                      onClick={() => setFontIdx(i)}
                      className={`rounded-xl border px-3 py-2 text-left text-sm transition ${i === fontIdx ? "border-ink bg-yellow/30" : "border-border hover:border-ink/40"} ${f.cls}`}
                    >
                      Aa
                      <span className="ml-2 font-mono-ui text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                        {f.label}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 font-mono-ui text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  ← seta esquerda
                </p>
              </div>
            </div>

            <Button
              onClick={handleSend}
              disabled={flying}
              size="lg"
              className="mt-6 h-14 w-full rounded-full bg-ink text-paper hover:bg-ink/90"
            >
              <Send className="mr-2 h-4 w-4" />
              enviar
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
