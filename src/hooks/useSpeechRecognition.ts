import { useEffect, useRef, useState } from "react";

type SR = any;

interface Options {
  lang?: string;
  enabled: boolean;
}

/**
 * Speech Recognition wrapper. Optimized for low-latency interim results and
 * resilient auto-restart on `no-speech` / `aborted` / `network`.
 */
export const useSpeechRecognition = ({ lang = "pt-PT", enabled }: Options) => {
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SR | null>(null);
  const enabledRef = useRef(enabled);
  const restartTimerRef = useRef<number | null>(null);
  enabledRef.current = enabled;

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    const rec: SR = new SpeechRecognition();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event: any) => {
      let finalT = "";
      let interimT = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalT += res[0].transcript;
        else interimT += res[0].transcript;
      }
      // Update synchronously — React batches but interim flushes on next paint
      if (finalT) {
        setTranscript((t) => (t + " " + finalT).trim());
        setInterim("");
      } else {
        setInterim(interimT);
      }
    };
    rec.onstart = () => setListening(true);
    rec.onend = () => {
      setListening(false);
      if (enabledRef.current) {
        if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
        restartTimerRef.current = window.setTimeout(() => {
          try { rec.start(); } catch {}
        }, 120);
      }
    };
    rec.onerror = (e: any) => {
      const err = e?.error;
      if (err && err !== "no-speech" && err !== "aborted") {
        console.warn("[SpeechRecognition] error:", err);
      }
      // for network/audio-capture errors, allow onend to retry
    };
    recRef.current = rec;

    return () => {
      enabledRef.current = false;
      if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
      try { rec.onend = null; rec.stop(); } catch {}
      recRef.current = null;
      setListening(false);
    };
  }, [lang]);

  useEffect(() => {
    const rec = recRef.current;
    if (!rec) return;
    if (enabled) {
      try { rec.start(); } catch {}
    } else {
      try { rec.stop(); } catch {}
    }
  }, [enabled]);

  const reset = () => { setTranscript(""); setInterim(""); };

  return { transcript, interim, supported, listening, reset };
};
