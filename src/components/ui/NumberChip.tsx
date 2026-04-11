"use client";

import { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NumberChipProps {
  /** The original digit value from the phrase (key for updates) */
  originalValue: number;
  /** The currently displayed value */
  currentValue: number;
  onChange: (originalValue: number, newValue: number) => void;
  /** "lg" for the main Japanese heading (text-3xl), "md" for variants (text-xl) */
  size?: "lg" | "md";
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * An inline tappable number chip that renders inside Japanese text.
 * When tapped, expands into a compact − value + editor.
 * Closing happens automatically on outside click/tap.
 */
export default function NumberChip({
  originalValue,
  currentValue,
  onChange,
  size = "lg",
}: NumberChipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  // Close on any outside pointer interaction
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [isOpen]);

  const handleChipClick = (e: React.MouseEvent) => {
    e.preventDefault(); // prevent link navigation if chip is inside a <Link>
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const decrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentValue > 1) onChange(originalValue, currentValue - 1);
  };

  const increment = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentValue < 99) onChange(originalValue, currentValue + 1);
  };

  const isEdited = currentValue !== originalValue;

  // ── Collapsed chip ─────────────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <span
        ref={containerRef}
        onClick={handleChipClick}
        role="button"
        tabIndex={0}
        aria-label={`Edit number: currently ${currentValue}`}
        onKeyDown={(e) => e.key === "Enter" && setIsOpen(true)}
        className={[
          "inline-flex items-center justify-center rounded-lg font-bold",
          "cursor-pointer select-none transition-all active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900",
          size === "lg"
            ? "px-2.5 py-0.5 mx-0.5 text-3xl leading-none"
            : "px-2 py-0 mx-0.5 text-xl leading-none",
          isEdited
            ? "bg-stone-900 text-white"
            : "bg-stone-150 text-stone-800 hover:bg-stone-200 border border-stone-200",
        ].join(" ")}
        title="Tap to change number"
      >
        {currentValue}
      </span>
    );
  }

  // ── Expanded editor ────────────────────────────────────────────────────────
  return (
    <span
      ref={containerRef}
      className={[
        "inline-flex items-center bg-stone-900 text-white rounded-xl",
        "shadow-lg align-middle",
        size === "lg" ? "gap-1.5 px-2 py-1 mx-0.5" : "gap-1 px-1.5 py-0.5 mx-0.5",
      ].join(" ")}
    >
      {/* Decrement */}
      <button
        onClick={decrement}
        aria-label="Decrease"
        disabled={currentValue <= 1}
        className={[
          "flex items-center justify-center rounded-lg bg-white/15",
          "hover:bg-white/25 active:scale-95 transition-all font-bold text-white",
          "disabled:opacity-30 disabled:cursor-not-allowed",
          size === "lg" ? "w-9 h-9 text-xl" : "w-7 h-7 text-base",
        ].join(" ")}
      >
        −
      </button>

      {/* Current value */}
      <span
        className={[
          "text-center tabular-nums font-bold leading-none",
          size === "lg" ? "text-3xl min-w-[1.6ch]" : "text-xl min-w-[1.2ch]",
        ].join(" ")}
      >
        {currentValue}
      </span>

      {/* Increment */}
      <button
        onClick={increment}
        aria-label="Increase"
        disabled={currentValue >= 99}
        className={[
          "flex items-center justify-center rounded-lg bg-white/15",
          "hover:bg-white/25 active:scale-95 transition-all font-bold text-white",
          "disabled:opacity-30 disabled:cursor-not-allowed",
          size === "lg" ? "w-9 h-9 text-xl" : "w-7 h-7 text-base",
        ].join(" ")}
      >
        +
      </button>
    </span>
  );
}
