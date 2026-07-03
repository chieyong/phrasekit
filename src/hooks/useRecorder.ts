"use client";

import { useCallback, useRef, useState } from "react";

// Microfoon-opname via MediaRecorder. Kiest een formaat dat de browser steunt
// (iOS Safari levert audio/mp4, Chrome audio/webm); Whisper accepteert beide.

const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mpeg"];

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  return MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

function extFor(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4"))  return "mp4";
  if (mime.includes("mpeg")) return "mp3";
  return "webm";
}

export interface Recording {
  blob: Blob;
  ext:  string;
  url:  string;
}

export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const recRef    = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime();
      const rec  = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      recRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setError("Geen toegang tot de microfoon.");
    }
  }, []);

  const stop = useCallback(() => new Promise<Recording | null>((resolve) => {
    const rec = recRef.current;
    if (!rec) { resolve(null); return; }
    rec.onstop = () => {
      const mime = rec.mimeType || pickMime() || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mime });
      streamRef.current?.getTracks().forEach((t) => t.stop());  // microfoon vrijgeven
      streamRef.current = null;
      recRef.current    = null;
      setRecording(false);
      resolve(blob.size ? { blob, ext: extFor(mime), url: URL.createObjectURL(blob) } : null);
    };
    rec.stop();
  }), []);

  return { recording, error, start, stop };
}
