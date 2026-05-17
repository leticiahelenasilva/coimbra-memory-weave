import { PixelCard } from "@/components/PixelCard";
import type { Variant } from "@/data/emotions";
import { getEmotionPixelColors, HIGHLIGHT_INK, isDarkHsl } from "@/lib/postcardStyle";
import type { KeyboardEventHandler, Ref } from "react";

interface PostcardFrontProps {
  memory: string;
  emotionLabel: string;
  variant: Variant;
  className?: string;
  radiusClassName?: string;
  contentClassName?: string;
  editable?: boolean;
  showEditHint?: boolean;
  postcardRef?: Ref<HTMLDivElement>;
  onMemoryChange?: (memory: string) => void;
  onMemoryKeyDown?: KeyboardEventHandler<HTMLSpanElement>;
}

export const PostcardFront = ({
  memory,
  emotionLabel,
  variant,
  className = "",
  radiusClassName = "rounded-[2rem]",
  contentClassName = "p-10",
  editable = false,
  showEditHint = false,
  postcardRef,
  onMemoryChange,
  onMemoryKeyDown,
}: PostcardFrontProps) => {
  const isDarkPostcard = isDarkHsl(variant.bg);

  return (
    <PixelCard
      colors={getEmotionPixelColors(variant)}
      gap={isDarkPostcard ? 6 : 10}
      speed={isDarkPostcard ? 35 : 25}
      maxPixelSize={isDarkPostcard ? 3.5 : 2}
      noFocus
      className={`${radiusClassName} ${className}`}
    >
      <div
        ref={postcardRef}
        className={`relative h-full w-full overflow-hidden ${radiusClassName}`}
        style={{ color: variant.ink }}
      >
        <div
          className={`paper absolute inset-0 z-0 ${radiusClassName}`}
          style={{ background: variant.bg }}
        />
        <article className={`relative z-[3] flex h-full w-full flex-col ${contentClassName}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="font-mono-ui text-[10px] uppercase tracking-[0.25em] opacity-70">
              postal · coimbra · {emotionLabel}
            </div>
            <div
              className="grid h-14 w-14 shrink-0 rotate-6 place-items-center rounded-md font-mono-ui text-[10px] uppercase tracking-widest"
              style={{ background: variant.accent, color: HIGHLIGHT_INK }}
            >
              pt'26
            </div>
          </div>

          <div className="mt-8 grid flex-1 grid-cols-12 gap-6">
            <div className="col-span-12">
              <p
                className={`${variant.fontCls} text-balance leading-[1.05]`}
                style={{ fontSize: "clamp(1.6rem, 3.6vw, 3rem)" }}
              >
                <span style={{ opacity: 0.6 }}>o que fica de Coimbra é</span>{" "}
                <span
                  contentEditable={editable}
                  suppressContentEditableWarning
                  onBlur={(e) => onMemoryChange?.(e.currentTarget.textContent?.trim() || "")}
                  onKeyDown={onMemoryKeyDown}
                  spellCheck={false}
                  className="relative z-[4] rounded-sm backdrop-blur-xl outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    background: variant.accent,
                    padding: "0 0.15em",
                    color: HIGHLIGHT_INK,
                    boxDecorationBreak: "clone",
                    WebkitBoxDecorationBreak: "clone",
                    minWidth: "1ch",
                  }}
                >
                  {memory}
                </span>
                <span style={{ color: variant.accent }}>.</span>
              </p>
              {showEditHint && (
                <p className="mt-3 font-mono-ui text-[10px] uppercase tracking-[0.2em]" style={{ opacity: 0.5 }}>
                  ✎ clica no texto para editar
                </p>
              )}
            </div>
          </div>

          <div className="flex items-end justify-between gap-4 font-mono-ui text-[10px] uppercase tracking-[0.22em]" style={{ opacity: 0.6 }}>
            <span>{variant.name}</span>
            <span>{variant.fontLabel}</span>
          </div>
        </article>
      </div>
    </PixelCard>
  );
};
