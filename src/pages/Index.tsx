import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Onboarding } from "@/components/steps/Onboarding";
import { MemoryMural } from "@/components/steps/MemoryMural";
import { Recording } from "@/components/steps/Recording";
import { Editor } from "@/components/steps/Editor";
import { Sent } from "@/components/steps/Sent";

type Step = "onboarding" | "mural" | "recording" | "editor" | "sent";

const Index = () => {
  const [step, setStep] = useState<Step>("onboarding");
  const [memory, setMemory] = useState<string>("");
  const [extraMemories, setExtraMemories] = useState<string[]>([]);

  const variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <main className="min-h-screen w-full bg-background">
      {/* SEO */}
      <h1 className="sr-only">O que fica de Coimbra — memorial digital interativo</h1>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {step === "onboarding" && (
            <Onboarding onBegin={() => setStep("mural")} />
          )}
          {step === "mural" && (
            <MemoryMural
              extraMemories={extraMemories}
              onContinue={() => setStep("recording")}
            />
          )}
          {step === "recording" && (
            <Recording
              onComplete={(m) => { setMemory(m); setStep("editor"); }}
            />
          )}
          {step === "editor" && (
            <Editor
              memory={memory}
              onSend={() => {
                setExtraMemories((prev) => [...prev, memory]);
                setStep("sent");
              }}
            />
          )}
          {step === "sent" && (
            <Sent
              memory={memory}
              extraMemories={extraMemories}
              onAgain={() => { setMemory(""); setStep("recording"); }}
              onHome={() => { setMemory(""); setStep("onboarding"); }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
};

export default Index;
