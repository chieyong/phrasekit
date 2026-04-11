"use client";

import { ChangeEvent } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Zinnen zoeken…",
  className = "",
}: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none text-sm">
        ⌕
      </span>
      <input
        type="text"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white rounded-xl pl-9 pr-10 py-2.5 text-sm text-stone-800 placeholder:text-stone-300 outline-none focus:ring-1 focus:ring-stone-300 transition border-0"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition text-sm"
          aria-label="Wis zoekopdracht"
        >
          ✕
        </button>
      )}
    </div>
  );
}
