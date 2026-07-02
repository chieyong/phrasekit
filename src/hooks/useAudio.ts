"use client";

import { useState, useCallback, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export type AudioState = "idle" | "playing" | "unsupported";

export interface UseAudioReturn {
  play: (text: string) => void;
  stop: () => void;
  audioState: AudioState;
}

// Module-level cache: "lang:text" → blob URL (survives re-renders, cleared on reload)
const audioCache = new Map<string, string>();
audioCache.clear();

// BCP-47 codes voor de browser-spraak (Web Speech API).
const BCP47: Record<string, string> = { ja: "ja-JP", zh: "zh-CN", yue: "zh-HK" };

export function useAudio(): UseAudioReturn {
  const { language } = useLanguage();
  const [audioState, setAudioState] = useState<AudioState>("idle");
  const audioElementRef  = useRef<HTMLAudioElement | null>(null);
  const utteranceRef     = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (typeof window === "undefined") return;
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = "";
      audioElementRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setAudioState("idle");
  }, []);

  // ── Web Speech API (fallback + primair voor Kantonees) ─────────────────────

  const getVoice = (lang: string): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    if (lang === "ja") {
      return voices.find((v) => v.lang === "ja-JP" && /female|kyoko|haruka/i.test(v.name)) ??
             voices.find((v) => v.lang === "ja-JP" && v.localService) ??
             voices.find((v) => v.lang === "ja-JP") ??
             voices.find((v) => v.lang.startsWith("ja")) ?? null;
    }
    if (lang === "yue") {
      // Kantonese stemmen: Sinji (Apple), of expliciete zh-HK / yue.
      return voices.find((v) => /sinji|aasing|aacing|cantonese/i.test(v.name)) ??
             voices.find((v) => v.lang === "zh-HK") ??
             voices.find((v) => v.lang.toLowerCase().startsWith("yue")) ??
             voices.find((v) => v.lang.toLowerCase().includes("hk")) ?? null;
    }
    // Mandarijn
    return voices.find((v) => v.lang === "zh-CN") ??
           voices.find((v) => v.lang.startsWith("zh")) ?? null;
  };

  const speakViaSpeechAPI = useCallback((text: string, lang: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang  = BCP47[lang] ?? "ja-JP";
    utterance.rate  = 0.85;
    utterance.pitch = lang === "ja" ? 1.1 : 1.0;
    const voice = getVoice(lang);
    if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }

    setAudioState("playing");
    utterance.onend   = () => setAudioState("idle");
    utterance.onerror = (e) => {
      if ((e as SpeechSynthesisErrorEvent).error !== "interrupted") setAudioState("idle");
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  // Wacht zo nodig tot de stemmen geladen zijn en spreek dan.
  const speakWhenReady = useCallback((text: string, lang: string) => {
    if (!("speechSynthesis" in window)) { setAudioState("unsupported"); return; }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) { setTimeout(() => speakViaSpeechAPI(text, lang), 50); return; }
    const onVoicesChanged = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      setTimeout(() => speakViaSpeechAPI(text, lang), 50);
    };
    window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
    setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      speakViaSpeechAPI(text, lang);
    }, 500);
  }, [speakViaSpeechAPI]);

  // ── OpenAI TTS (primair voor Japans/Mandarijn) ─────────────────────────────

  const playViaOpenAI = useCallback(async (text: string, lang: string): Promise<boolean> => {
    try {
      const key = `${lang}:${text}`;
      let url = audioCache.get(key);
      if (!url) {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) return false;
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        audioCache.set(key, url);
      }
      const audio = new Audio(url);
      audioElementRef.current = audio;
      audio.onended = () => { audioElementRef.current = null; setAudioState("idle"); };
      audio.onerror = () => { audioElementRef.current = null; setAudioState("idle"); };
      await audio.play();
      setAudioState("playing");
      return true;
    } catch {
      return false;
    }
  }, []);

  // ── Public play ────────────────────────────────────────────────────────────

  const play = useCallback(
    (text: string) => {
      if (typeof window === "undefined") return;
      window.speechSynthesis?.cancel();
      if (audioElementRef.current) { audioElementRef.current.pause(); audioElementRef.current = null; }

      // Kantonees: OpenAI-TTS spreekt Chinese karakters als Mandarijn uit →
      // gebruik direct de browser-spraak (Kantonese stem indien beschikbaar).
      if (language === "yue") {
        if ("speechSynthesis" in window) { speakWhenReady(text, "yue"); }
        else { playViaOpenAI(text, "yue"); } // laatste redmiddel (klinkt Mandarijn)
        return;
      }

      // Japans/Mandarijn: OpenAI eerst, browser-spraak als terugval.
      playViaOpenAI(text, language).then((success) => {
        if (!success) speakWhenReady(text, language);
      });
    },
    [language, playViaOpenAI, speakWhenReady]
  );

  return { play, stop, audioState };
}
