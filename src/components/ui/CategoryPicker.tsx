"use client";

import { useState, useEffect, useRef } from "react";
import { categories } from "@/data/mockData";
import { UserCategory } from "@/hooks/useUserPhrases";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoryPickerProps {
  userCategories: UserCategory[];
  onSelect: (categoryId: string) => void;
  onAddCategory: (name: string, icon: string) => UserCategory;
  onClose: () => void;
}

// Common travel emojis for quick icon picking
const QUICK_ICONS = [
  "🗺️","🎒","🚌","✈️","🚢","🏔️","🛒","💊","📸","🎌",
  "🌸","🍱","🎵","🎭","💴","🏯","🌊","🍵","🎎","🛕",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CategoryPicker({
  userCategories,
  onSelect,
  onAddCategory,
  onClose,
}: CategoryPickerProps) {
  const [mode, setMode] = useState<"list" | "new">("list");
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("🗺️");
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Focus name input when switching to "new" mode
  useEffect(() => {
    if (mode === "new") {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [mode]);

  // Close on backdrop tap
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    const cat = onAddCategory(name, newIcon);
    onSelect(cat.id);
  };

  const allCategories = [...categories, ...userCategories];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      onClick={handleBackdrop}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Sheet — capped at 80 vh so it never runs off screen */}
      <div className="relative w-full max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[80vh]">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-stone-200" />
        </div>

        {mode === "list" ? (
          <>
            {/* Header — stays visible */}
            <div className="px-5 pt-3 pb-2 shrink-0">
              <p className="text-sm font-semibold text-stone-900">
                Opslaan in categorie
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                Kies een bestaande of maak een nieuwe aan
              </p>
            </div>

            {/* Scrollable category list */}
            <div className="px-3 overflow-y-auto flex-1">
              {allCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onSelect(cat.id)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-stone-50 active:bg-stone-100 transition-colors text-left"
                >
                  <span className="text-xl shrink-0">{cat.icon}</span>
                  <span className="text-sm font-medium text-stone-800">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>

            {/* New category button — always visible at the bottom */}
            <div className="px-3 pb-8 pt-1 border-t border-stone-100 shrink-0">
              <button
                onClick={() => setMode("new")}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-stone-50 active:bg-stone-100 transition-colors text-left"
              >
                <span className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 text-base shrink-0">
                  +
                </span>
                <span className="text-sm font-medium text-stone-500">
                  Nieuwe categorie aanmaken
                </span>
              </button>
            </div>
          </>
        ) : (
          /* New category form — scrollable so keyboard doesn't hide the button */
          <div className="px-5 pt-3 pb-8 overflow-y-auto flex-1">
            <button
              onClick={() => setMode("list")}
              className="text-xs text-stone-400 mb-3 hover:text-stone-600 transition-colors"
            >
              ← Terug
            </button>
            <p className="text-sm font-semibold text-stone-900 mb-4">
              Nieuwe categorie
            </p>

            {/* Icon picker */}
            <p className="text-xs text-stone-400 mb-2 uppercase tracking-widest font-semibold">
              Icoon
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {QUICK_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setNewIcon(emoji)}
                  className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all ${
                    newIcon === emoji
                      ? "bg-stone-900 scale-105"
                      : "bg-stone-100 hover:bg-stone-200"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Name input */}
            <p className="text-xs text-stone-400 mb-2 uppercase tracking-widest font-semibold">
              Naam
            </p>
            <input
              ref={nameInputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="bijv. Musea, Strand, Zakelijk…"
              maxLength={30}
              className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-900 placeholder:text-stone-300 outline-none focus:ring-1 focus:ring-stone-300 transition mb-4"
            />

            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="w-full bg-stone-900 text-white rounded-xl py-3 text-sm font-medium disabled:opacity-30 active:scale-95 transition-all"
            >
              Aanmaken en opslaan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
