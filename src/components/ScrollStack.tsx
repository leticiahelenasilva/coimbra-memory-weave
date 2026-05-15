import { Children, ReactNode, useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

interface ItemProps {
  children: ReactNode;
  index: number;
  total: number;
  progress: MotionValue<number>;
}

const Item = ({ children, index, total, progress }: ItemProps) => {
  // Each item occupies a slice of [0, 1]. As scroll progresses past its slice,
  // the item scales down slightly and fades a touch — the next one stacks on top.
  const start = index / total;
  const end = (index + 1) / total;

  const scale = useTransform(progress, [start, end], [1, 0.92]);
  const y = useTransform(progress, [start, end], [0, -30]);
  const opacity = useTransform(progress, [start, end], [1, 0.6]);

  // Last card stays put.
  const isLast = index === total - 1;

  return (
    <div className="sticky top-24 mb-8 flex justify-center px-6" style={{ zIndex: index + 1 }}>
      <motion.div
        style={isLast ? undefined : { scale, y, opacity }}
        className="w-full max-w-5xl"
      >
        {children}
      </motion.div>
    </div>
  );
};

export const ScrollStackItem = ({ children }: { children: ReactNode }) => <>{children}</>;

interface ScrollStackProps {
  children: ReactNode;
  className?: string;
}

export const ScrollStack = ({ children, className = "" }: ScrollStackProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const items = Children.toArray(children);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ minHeight: `${items.length * 100}vh` }}
    >
      {items.map((child, i) => (
        <Item key={i} index={i} total={items.length} progress={scrollYProgress}>
          {child}
        </Item>
      ))}
    </div>
  );
};
