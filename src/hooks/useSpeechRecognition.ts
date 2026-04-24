import { useEffect, useRef, useState } from "react";

// Web Speech API typings (browser-vendored)
type SR = any;

interface Options {
  lang?: string;
  enabled: boolean;
}

export const useSpeechRecognition = ({ lang = "pt-PT", enabled }: Options) => {
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SR | null>(null);

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
    rec.onend = () => {
      // Auto-restart while enabled
      if (enabled) {
        try { rec.start(); } catch {}
      } else {
        setListening(false);
      }
    };
    rec.onerror = () => {};
    recRef.current = rec;

    return () => {
      try { rec.stop(); } catch {}
      recRef.current = null;
    };
  }, [lang, enabled]);

  useEffect(() => {
    const rec = recRef.current;
    if (!rec) return;
    if (enabled) {
      try { rec.start(); setListening(true); } catch {}
    } else {
      try { rec.stop(); } catch {}
      setListening(false);
    }
  }, [enabled]);

  const reset = () => { setTranscript(""); setInterim(""); };

  return { transcript, interim, supported, listening, reset };
};
