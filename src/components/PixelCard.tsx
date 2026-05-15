import { ReactNode, useEffect, useRef } from "react";
import "./PixelCard.css";

interface PixelCardProps {
  children: ReactNode;
  color: string; // CSS color used to tint pixels
  className?: string;
  pixelSize?: number;
  density?: number; // 0..1 chance for any given cell to render a pixel
}

type Pixel = {
  x: number;
  y: number;
  size: number;
  alphaTarget: number;
  alpha: number;
  delay: number;
};

export const PixelCard = ({
  children,
  color,
  className = "",
  pixelSize = 6,
  density = 0.55,
}: PixelCardProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef<"in" | "out">("out");
  const startedAtRef = useRef<number>(0);

  // Build pixel grid sized to wrapper
  const build = () => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = wrap.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const cols = Math.ceil(rect.width / pixelSize);
    const rows = Math.ceil(rect.height / pixelSize);
    const pixels: Pixel[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() > density) continue;
        // Edge bias: pixels near edges are denser
        const edgeBias = Math.min(c, cols - c, r, rows - r);
        const edgeFactor = 1 - Math.min(edgeBias / 8, 1);
        if (Math.random() > 0.35 + edgeFactor * 0.4) continue;
        pixels.push({
          x: c * pixelSize,
          y: r * pixelSize,
          size: pixelSize,
          alphaTarget: 0.25 + Math.random() * 0.55,
          alpha: 0,
          delay: Math.random() * 280,
        });
      }
    }
    pixelsRef.current = pixels;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const now = performance.now();
    const elapsed = now - startedAtRef.current;
    let stillAnimating = false;
    for (const p of pixelsRef.current) {
      const target = phaseRef.current === "in" ? p.alphaTarget : 0;
      const localElapsed = Math.max(0, elapsed - p.delay);
      const t = Math.min(1, localElapsed / 260);
      const eased = t * t * (3 - 2 * t);
      p.alpha = phaseRef.current === "in" ? eased * target : (1 - eased) * p.alphaTarget;
      if (t < 1) stillAnimating = true;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      ctx.fillStyle = color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    if (stillAnimating) {
      rafRef.current = requestAnimationFrame(draw);
    } else {
      rafRef.current = null;
    }
  };

  const start = (phase: "in" | "out") => {
    phaseRef.current = phase;
    startedAtRef.current = performance.now();
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    build();
    const onResize = () => {
      build();
      draw();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pixelSize, density, color]);

  return (
    <div
      ref={wrapRef}
      className={`pixel-card-wrapper ${className}`}
      onMouseEnter={() => start("in")}
      onMouseLeave={() => start("out")}
    >
      {children}
      <canvas ref={canvasRef} className="pixel-card-canvas" aria-hidden />
    </div>
  );
};
