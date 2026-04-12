"use client";

import { useState, useCallback, useRef } from "react";

export type AudioState = "idle" | "playing" | "unsupported";

export interface UseAudioReturn {
  play: (text: string) => void;
  stop: () => void;
  audioState: AudioState;
}

/**
 * Wraps the Web Speech API (SpeechSynthesis) for Japanese TTS.
 *
 * iOS-specific fixes applied:
 * - Voices load asynchronously on iOS; wait for `voiceschanged` if needed
 * - iOS ignores speak() called immediately after cancel(); use a short timeout
 * - onstart is unreliable on iOS; set state to "playing" optimistically
 */
export function useAudio(): UseAudioReturn {
  const [audioState, setAudioState] = useState<AudioState>("idle");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    setAudioState("idle");
  }, []);

  // Pick the best available Japanese voice
  const getJapaneseVoice = (): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((v) => v.lang === "ja-JP" && v.localService) ??
      voices.find((v) => v.lang === "ja-JP") ??
      voices.find((v) => v.lang.startsWith("ja")) ??
      null
    );
  };

  const speakNow = useCallback(
    (text: string) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang  = "ja-JP";
      utterance.rate  = 0.85;
      utterance.pitch = 1;

      const voice = getJapaneseVoice();
      if (voice) utterance.voice = voice;

      // iOS: onstart is unreliable — set state immediately
      setAudioState("playing");

      utterance.onend   = () => setAudioState("idle");
      utterance.onerror = (e) => {
        // "interrupted" is harmless (fired when cancel() is called)
        if ((e as SpeechSynthesisErrorEvent).error !== "interrupted") {
          setAudioState("idle");
        }
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    []
  );

  const play = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setAudioState("unsupported");
        return;
      }

      // Cancel any in-flight speech
      window.speechSynthesis.cancel();

      const voices = window.speechSynthesis.getVoices();

      if (voices.length > 0) {
        // Voices already loaded — iOS needs a small gap after cancel()
        setTimeout(() => speakNow(text), 50);
      } else {
        // Voices not yet loaded (common on first load in iOS/Chrome)
        const onVoicesChanged = () => {
          window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
          setTimeout(() => speakNow(text), 50);
        };
        window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);

        // Fallback: if voiceschanged never fires (some browsers), try after 500ms
        setTimeout(() => {
          window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
          speakNow(text);
        }, 500);
      }
    },
    [speakNow]
  );

  return { play, stop, audioState };
}
