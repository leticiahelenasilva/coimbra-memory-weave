import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Stamp } from "../Stamp";
import { Fog } from "../Fog";

interface Props {
  memory: string;
  onAgain: () => void;
}

export const Sent = ({ memory, onAgain }: Props) => {
  return (
    <section className="relative grid min-h-screen w-full place-items-center overflow-hidden bg-background px-6">
      <Fog intensity={1.2} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto max-w-2xl text-center"
      >
        <Stamp>enviado · obrigado</Stamp>
        <h2 className="mt-8 font-serif-display text-5xl italic leading-tight text-ink md:text-6xl">
          a tua memória partiu<br />
          com o vento do <span className="highlight-yellow not-italic">Mondego</span>.
        </h2>
        <p className="mt-6 font-serif italic text-muted-foreground text-balance text-xl">
          "{memory}"
        </p>
        <p className="mt-10 font-mono-ui text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          fica agora a viver no mural · para quem chegar depois
        </p>
        <Button
          onClick={onAgain}
          size="lg"
          className="mt-8 h-14 rounded-full bg-ink px-8 text-paper hover:bg-ink/90"
        >
          deixar outra memória
        </Button>
      </motion.div>
    </section>
  );
};
