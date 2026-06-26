import { useState, useRef, useCallback, useEffect } from "react";
import { isDesktop } from "../lib/device";

type RecognitionLike = {
  lang: string; continuous: boolean; interimResults: boolean;
  start: () => void; stop: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};

export function useRecording(onFinal: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const recRef = useRef<RecognitionLike | null>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(isDesktop() && !!SR);
  }, []);

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec: RecognitionLike = new SR();
    rec.lang = "zh-CN"; rec.continuous = true; rec.interimResults = true;
    let finalBuf = "";
    rec.onresult = (e: any) => {
      let interimBuf = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalBuf += t;
        else interimBuf += t;
      }
      setInterim(interimBuf);
      if (finalBuf) onFinal(finalBuf);
    };
    rec.onerror = () => { setRecording(false); };
    rec.onend = () => { setRecording(false); };
    recRef.current = rec;
    rec.start();
    setRecording(true);
  }, [onFinal]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setRecording(false);
  }, []);

  return { supported, recording, interim, start, stop };
}
