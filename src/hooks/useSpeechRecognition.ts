import { useEffect, useRef, useState } from "react";

type SpeechRecognitionErrorCode =
  | "no-speech"
  | "aborted"
  | "audio-capture"
  | "network"
  | "not-allowed"
  | "service-not-allowed"
  | "bad-grammar"
  | "language-not-supported";

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  readonly [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  readonly error: SpeechRecognitionErrorCode;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

interface SpeechWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

interface Options {
  lang?: string;
  enabled: boolean;
}

/**
 * Wrapper de reconhecimento de voz com resultados intermédios rápidos e retoma automática.
 */
export const useSpeechRecognition = ({ lang = "pt-PT", enabled }: Options) => {
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const enabledRef = useRef(enabled);
  const restartTimerRef = useRef<number | null>(null);
  enabledRef.current = enabled;

  useEffect(() => {
    const speechWindow = window as SpeechWindow;
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      let finalT = "";
      let interimT = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalT += res[0].transcript;
        else interimT += res[0].transcript;
      }
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
          try {
            rec.start();
          } catch {
            // Alguns browsers lançam erro se o reconhecimento já estiver ativo.
          }
        }, 120);
      }
    };
    rec.onerror = (e) => {
      const err = e?.error;
      if (err && err !== "no-speech" && err !== "aborted") {
        console.warn("[SpeechRecognition] error:", err);
      }
    };
    recRef.current = rec;

    return () => {
      enabledRef.current = false;
      if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
      try {
        rec.onend = null;
        rec.stop();
      } catch {
        // Mantém a limpeza local mesmo quando a Web Speech API já terminou a sessão.
      }
      recRef.current = null;
      setListening(false);
    };
  }, [lang]);

  useEffect(() => {
    const rec = recRef.current;
    if (!rec) return;
    if (enabled) {
      try {
        rec.start();
      } catch {
        // Ignora tentativas duplicadas disparadas por mudanças rápidas de estado.
      }
    } else {
      try {
        rec.stop();
      } catch {
        // Ignora paragens redundantes quando o browser já encerrou a captura.
      }
    }
  }, [enabled]);

  const reset = () => { setTranscript(""); setInterim(""); };

  return { transcript, interim, supported, listening, reset };
};
