import { useEffect, useRef, useState } from "react";

type SR = any;

interface Options {
  lang?: string;
  enabled: boolean;
}

/**
 * Wrapper around the Web Speech API. The recognizer instance is created once
 * (per `lang`) and start/stop is driven by `enabled` — this avoids tearing it
 * down on every toggle, which was wiping the transcript mid-stream.
 */
export const useSpeechRecognition = ({ lang = "pt-PT", enabled }: Options) => {
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SR | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // Create the recognizer once per language
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

    rec.onresult = (event: any) => {
      let finalT = "";
      let interimT = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalT += res[0].transcript;
        else interimT += res[0].transcript;
      }
      if (finalT) setTranscript((t) => (t + " " + finalT).trim());
      setInterim(interimT);
    };
    rec.onstart = () => setListening(true);
    rec.onend = () => {
      setListening(false);
      // Auto-restart if still wanted
      if (enabledRef.current) {
        try { rec.start(); } catch {}
      }
    };
    rec.onerror = (e: any) => {
      // 'no-speech' and 'aborted' are noisy but recoverable
      if (e?.error && e.error !== "no-speech" && e.error !== "aborted") {
        console.warn("[SpeechRecognition] error:", e.error);
      }
    };
    recRef.current = rec;

    return () => {
      enabledRef.current = false;
      try { rec.onend = null; rec.stop(); } catch {}
      recRef.current = null;
      setListening(false);
    };
  }, [lang]);

  // Drive start/stop with `enabled`
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
