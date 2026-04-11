"use client";

import { useState, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AudioState = "idle" | "playing" | "unsupported";

export interface UseAudioReturn {
  play: (text: string) => void;
  stop: () => void;
  audioState: AudioState;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Wraps the Web Speech API (SpeechSynthesis) for Japanese TTS.
 * No cost, works offline, good-enough quality for travel use.
 *
 * Usage:
 *   const { play, audioState } = useAudio();
 *   play(phrase.translatedText); // speaks in ja-JP
 */
export function useAudio(): UseAudioReturn {
  const [audioState, setAudioState] = useState<AudioState>("idle");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    setAudioState("idle");
  }, []);

  const play = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setAudioState("unsupported");
        return;
      }

      // Cancel any in-flight speech first
      stop();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.rate = 0.85; // slightly slower — easier to follow along
      utterance.pitch = 1;

      utterance.onstart = () => setAudioState("playing");
      utterance.onend = () => setAudioState("idle");
      utterance.onerror = () => setAudioState("idle");

      utteranceRef.current = utterance;
      setAudioState("playing");
      window.speechSynthesis.speak(utterance);
    },
    [stop]
  );

  return { play, stop, audioState };
}
