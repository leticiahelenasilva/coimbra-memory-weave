import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Onboarding } from "@/components/steps/Onboarding";
import { MemoryMural } from "@/components/steps/MemoryMural";
import { Recording } from "@/components/steps/Recording";
import { Analyzing } from "@/components/steps/Analyzing";
import { Editor } from "@/components/steps/Editor";
import { Sent } from "@/components/steps/Sent";
import { EmotionKey, EMOTIONS } from "@/data/emotions";

type Step = "onboarding" | "mural" | "recording" | "analyzing" | "editor" | "sent";

const STEP_TO_PATH: Record<Step, string> = {
  onboarding: "/passo1",
  mural: "/passo2",
  recording: "/passo3",
  analyzing: "/passo4",
  editor: "/passo5",
  sent: "/passo6",
};

const PATH_TO_STEP: Record<string, Step> = {
  "/": "onboarding",
  "/passo1": "onboarding",
  "/passo2": "mural",
  "/passo3": "recording",
  "/passo4": "analyzing",
  "/passo5": "editor",
  "/passo6": "sent",
};

const SS_MEMORY = "oqfc:memory";
const SS_EMOTION = "oqfc:emotion";
const SS_EXTRAS = "oqfc:extras";

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const initialStep: Step = PATH_TO_STEP[location.pathname] ?? "onboarding";
  const [step, setStep] = useState<Step>(initialStep);

  const [memory, setMemory] = useState<string>(
    () => sessionStorage.getItem(SS_MEMORY) ?? ""
  );
  const [emotion, setEmotion] = useState<EmotionKey | undefined>(() => {
    const e = sessionStorage.getItem(SS_EMOTION);
    return e && e in EMOTIONS ? (e as EmotionKey) : undefined;
  });
  const [extraMemories, setExtraMemories] = useState<string[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(SS_EXTRAS) ?? "[]");
    } catch {
      return [];
    }
  });

  // Persist
  useEffect(() => { sessionStorage.setItem(SS_MEMORY, memory); }, [memory]);
  useEffect(() => {
    if (emotion) sessionStorage.setItem(SS_EMOTION, emotion);
    else sessionStorage.removeItem(SS_EMOTION);
  }, [emotion]);
  useEffect(() => {
    sessionStorage.setItem(SS_EXTRAS, JSON.stringify(extraMemories));
  }, [extraMemories]);

  // Sync URL → state (back/forward + manual nav)
  useEffect(() => {
    const next = PATH_TO_STEP[location.pathname];
    if (!next || next === step) return;
    // Guard rails: redirect if required data is missing
    if ((next === "analyzing" || next === "editor" || next === "sent") && !memory) {
      navigate("/passo3", { replace: true });
      return;
    }
    if (next === "editor" && !emotion) {
      navigate("/passo4", { replace: true });
      return;
    }
    setStep(next);
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const goto = (s: Step) => {
    setStep(s);
    const target = STEP_TO_PATH[s];
    if (location.pathname !== target) navigate(target);
  };

  const variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <main className="min-h-screen w-full bg-background">
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
            <Onboarding
              onBegin={() => goto("mural")}
              onVoiceTrigger={() => goto("recording")}
            />
          )}
          {step === "mural" && (
            <MemoryMural
              extraMemories={extraMemories}
              onContinue={() => goto("recording")}
            />
          )}
          {step === "recording" && (
            <Recording
              onComplete={(m) => {
                setMemory(m);
                setEmotion(undefined);
                goto("analyzing");
              }}
            />
          )}
          {step === "analyzing" && memory && (
            <Analyzing
              memory={memory}
              onDone={(e) => {
                setEmotion(e);
                goto("editor");
              }}
            />
          )}
          {step === "editor" && memory && (
            <Editor
              memory={memory}
              initialEmotion={emotion}
              onSend={() => {
                setExtraMemories((prev) => [...prev, memory]);
                goto("sent");
              }}
            />
          )}
          {step === "sent" && (
            <Sent
              memory={memory}
              extraMemories={extraMemories}
              onAgain={() => { setMemory(""); setEmotion(undefined); goto("recording"); }}
              onHome={() => { setMemory(""); setEmotion(undefined); goto("onboarding"); }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
};

export default Index;
