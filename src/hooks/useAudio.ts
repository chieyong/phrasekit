"use client";

import { useState, useCallback, useRef } from "react";

export type AudioState = "idle" | "playing" | "unsupported";

export interface UseAudioReturn {
  play: (text: string) => void;
  stop: () => void;
  audioState: AudioState;
}

// Module-level cache: Japanese text → blob URL (survives re-renders)
const audioCache = new Map<string, string>();

export function useAudio(): UseAudioReturn {
  const [audioState, setAudioState] = useState<AudioState>("idle");
  const audioElementRef  = useRef<HTMLAudioElement | null>(null);
  const utteranceRef     = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (typeof window === "undefined") return;
    // Stop HTML Audio (OpenAI TTS)
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = "";
      audioElementRef.current = null;
    }
    // Stop Web Speech API (fallback)
    window.speechSynthesis?.cancel();
    setAudioState("idle");
  }, []);

  // ── Fallback: Web Speech API ───────────────────────────────────────────────

  const getJapaneseVoice = (): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((v) => v.lang === "ja-JP" && /female|kyoko|haruka/i.test(v.name)) ??
      voices.find((v) => v.lang === "ja-JP" && v.localService) ??
      voices.find((v) => v.lang === "ja-JP") ??
      voices.find((v) => v.lang.startsWith("ja")) ??
      null
    );
  };

  const speakViaSpeechAPI = useCallback((text: string) => {
    const utterance    = new SpeechSynthesisUtterance(text);
    utterance.lang     = "ja-JP";
    utterance.rate     = 0.85;
    utterance.pitch    = 1.1;
    const voice = getJapaneseVoice();
    if (voice) utterance.voice = voice;

    setAudioState("playing");
    utterance.onend   = () => setAudioState("idle");
    utterance.onerror = (e) => {
      if ((e as SpeechSynthesisErrorEvent).error !== "interrupted") setAudioState("idle");
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  // ── Primary: OpenAI TTS ────────────────────────────────────────────────────

  const playViaOpenAI = useCallback(async (text: string): Promise<boolean> => {
    try {
      let url = audioCache.get(text);

      if (!url) {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) return false;
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        audioCache.set(text, url);
      }

      const audio = new Audio(url);
      audioElementRef.current = audio;

      audio.onended = () => {
        audioElementRef.current = null;
        setAudioState("idle");
      };
      audio.onerror = () => {
        audioElementRef.current = null;
        setAudioState("idle");
      };

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

      // Cancel any current speech
      window.speechSynthesis?.cancel();
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }

      // Try OpenAI TTS first; fall back to Web Speech API on failure
      playViaOpenAI(text).then((success) => {
        if (!success) {
          if (!("speechSynthesis" in window)) {
            setAudioState("unsupported");
            return;
          }
          const voices = window.speechSynthesis.getVoices();
          if (voices.length > 0) {
            setTimeout(() => speakViaSpeechAPI(text), 50);
          } else {
            const onVoicesChanged = () => {
              window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
              setTimeout(() => speakViaSpeechAPI(text), 50);
            };
            window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
            setTimeout(() => {
              window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
              speakViaSpeechAPI(text);
            }, 500);
          }
        }
      });
    },
    [playViaOpenAI, speakViaSpeechAPI]
  );

  return { play, stop, audioState };
}
