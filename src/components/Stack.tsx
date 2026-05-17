import {
  forwardRef,
  type ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import "./Stack.css";

type AnimationConfig = {
  stiffness: number;
  damping: number;
};

type StackCard = {
  id: number;
  content: ReactNode;
};

export type StackHandle = {
  next: () => void;
  previous: () => void;
};

type StackProps = {
  randomRotation?: boolean;
  sensitivity?: number;
  cards?: ReactNode[];
  animationConfig?: AnimationConfig;
  sendToBackOnClick?: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  mobileClickOnly?: boolean;
  mobileBreakpoint?: number;
};

type CardRotateProps = {
  children: ReactNode;
  onSendToBack: () => void;
  sensitivity: number;
  disableDrag?: boolean;
};

const EMPTY_CARDS: ReactNode[] = [];

const DEFAULT_CARDS: StackCard[] = [
  {
    id: 1,
    content: (
      <img
        src="https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=500&auto=format"
        alt="card-1"
        className="stack-card-image"
      />
    ),
  },
  {
    id: 2,
    content: (
      <img
        src="https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=500&auto=format"
        alt="card-2"
        className="stack-card-image"
      />
    ),
  },
  {
    id: 3,
    content: (
      <img
        src="https://images.unsplash.com/photo-1452626212852-811d58933cae?q=80&w=500&auto=format"
        alt="card-3"
        className="stack-card-image"
      />
    ),
  },
  {
    id: 4,
    content: (
      <img
        src="https://images.unsplash.com/photo-1572120360610-d971b9d7767c?q=80&w=500&auto=format"
        alt="card-4"
        className="stack-card-image"
      />
    ),
  },
];

function CardRotate({ children, onSendToBack, sensitivity, disableDrag = false }: CardRotateProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [60, -60]);
  const rotateY = useTransform(x, [-100, 100], [-60, 60]);

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number } }) {
    if (Math.abs(info.offset.x) > sensitivity || Math.abs(info.offset.y) > sensitivity) {
      onSendToBack();
    } else {
      x.set(0);
      y.set(0);
    }
  }

  if (disableDrag) {
    return (
      <motion.div className="stack-card-rotate-disabled" style={{ x: 0, y: 0 }}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="stack-card-rotate"
      style={{ x, y, rotateX, rotateY }}
      drag
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={0.6}
      whileTap={{ cursor: "grabbing" }}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  );
}

export const Stack = forwardRef<StackHandle, StackProps>(
  (
    {
      randomRotation = false,
      sensitivity = 200,
      cards: providedCards,
      animationConfig = { stiffness: 260, damping: 20 },
      sendToBackOnClick = false,
      autoplay = false,
      autoplayDelay = 3000,
      pauseOnHover = false,
      mobileClickOnly = false,
      mobileBreakpoint = 768,
    },
    ref,
  ) => {
    const cards = providedCards ?? EMPTY_CARDS;
    const cardCount = cards.length;
    const rotationCount = cardCount || DEFAULT_CARDS.length;
    const [isMobile, setIsMobile] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [stack, setStack] = useState<StackCard[]>(() =>
      cardCount ? cards.map((content, index) => ({ id: index + 1, content })) : DEFAULT_CARDS,
    );

    const cardRotations = useMemo(
      () => Array.from({ length: rotationCount }, () => (randomRotation ? Math.random() * 10 - 5 : 0)),
      [randomRotation, rotationCount],
    );

    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < mobileBreakpoint);
      };

      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, [mobileBreakpoint]);

    useEffect(() => {
      setStack(cardCount ? cards.map((content, index) => ({ id: index + 1, content })) : DEFAULT_CARDS);
    }, [cardCount, cards]);

    const sendToBack = useCallback((id: number) => {
      setStack((prev) => {
        const newStack = [...prev];
        const index = newStack.findIndex((card) => card.id === id);
        if (index < 0) return prev;
        const [card] = newStack.splice(index, 1);
        newStack.unshift(card);
        return newStack;
      });
    }, []);

    const next = useCallback(() => {
      setStack((prev) => {
        if (prev.length < 2) return prev;
        const newStack = [...prev];
        const [card] = newStack.splice(newStack.length - 1, 1);
        newStack.unshift(card);
        return newStack;
      });
    }, []);

    const previous = useCallback(() => {
      setStack((prev) => {
        if (prev.length < 2) return prev;
        const newStack = [...prev];
        const [card] = newStack.splice(0, 1);
        newStack.push(card);
        return newStack;
      });
    }, []);

    useImperativeHandle(ref, () => ({ next, previous }), [next, previous]);

    useEffect(() => {
      if (autoplay && stack.length > 1 && !isPaused) {
        const interval = setInterval(next, autoplayDelay);
        return () => clearInterval(interval);
      }
    }, [autoplay, autoplayDelay, isPaused, next, stack.length]);

    const shouldDisableDrag = mobileClickOnly && isMobile;
    const shouldEnableClick = sendToBackOnClick || shouldDisableDrag;

    return (
      <div
        className="stack-container"
        onMouseEnter={() => pauseOnHover && setIsPaused(true)}
        onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      >
        {stack.map((card, index) => (
          <CardRotate
            key={card.id}
            onSendToBack={() => sendToBack(card.id)}
            sensitivity={sensitivity}
            disableDrag={shouldDisableDrag}
          >
            <motion.div
              className="stack-card"
              onClick={() => shouldEnableClick && sendToBack(card.id)}
              animate={{
                rotateZ: (stack.length - index - 1) * 4 + (cardRotations[card.id - 1] ?? 0),
                scale: 1 + index * 0.06 - stack.length * 0.06,
                transformOrigin: "90% 90%",
              }}
              initial={false}
              transition={{
                type: "spring",
                stiffness: animationConfig.stiffness,
                damping: animationConfig.damping,
              }}
            >
              {card.content}
            </motion.div>
          </CardRotate>
        ))}
      </div>
    );
  },
);

Stack.displayName = "Stack";
