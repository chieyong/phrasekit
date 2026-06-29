"use client";

import { useState, useEffect, useRef } from "react";
import { categories } from "@/data/mockData";
import { UserCategory } from "@/hooks/useUserPhrases";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoryPickerProps {
  userCategories: UserCategory[];
  onSelect: (categoryId: string) => void;
  onAddCategory: (name: string, icon: string) => Promise<UserCategory>;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  initialMode?: "list" | "new";
  // Bewerk-modus: vul met een bestaande categorie om naam + icoon te wijzigen.
  editCategory?: { id: string; name: string; icon: string };
  onUpdateCategory?: (id: string, name: string, icon: string) => Promise<void>;
}

const QUICK_ICONS = [
  "🗺️","🎒","🧳","✈️","🚄","🚌","🚕","🚢","🚲","⛴️",
  "🚉","🏨","🏯","⛩️","🗼","🏛️","🏝️","🏔️","🏖️","🏪",
  "🏥","🛒","🛍️","💴","💳","🔑","📱","📸","🎫","🗾",
  "🍜","🍣","🍱","🍙","🍵","🍺","☕","🍰","🥟","🍢",
  "🌸","🌊","♨️","🎌","🎭","🎵","🎎","💊","🆘","🙏",
  "❤️","⚽","🎮","🐱","☀️","🌙","☂️","🛕",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CategoryPicker({
  userCategories,
  onSelect,
  onAddCategory,
  onClose,
  title = "Opslaan in categorie",
  subtitle = "Kies een bestaande of maak een nieuwe aan",
  initialMode = "list",
  editCategory,
  onUpdateCategory,
}: CategoryPickerProps) {
  const isEditing = !!editCategory;
  const [mode,    setMode]    = useState<"list" | "new">(isEditing ? "new" : initialMode);
  const [newName, setNewName] = useState(editCategory?.name ?? "");
  const [newIcon, setNewIcon] = useState(editCategory?.icon ?? "🗺️");
  const [saving,  setSaving]  = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "new") setTimeout(() => nameInputRef.current?.focus(), 100);
  }, [mode]);

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSave = async () => {
    const name = newName.trim();
    if (!name || saving) return;
    setSaving(true);
    try {
      if (isEditing && onUpdateCategory) {
        await onUpdateCategory(editCategory!.id, name, newIcon);
        onClose();
      } else {
        const cat = await onAddCategory(name, newIcon);
        onSelect(cat.id);
      }
    } finally {
      setSaving(false);
    }
  };

  const allCategories = [...categories, ...userCategories];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      onClick={handleBackdrop}
    >
      {/* Backdrop — klikken sluit het sheet */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-md mx-auto bg-white dark:bg-stone-900 rounded-t-3xl shadow-2xl">

        {/* Handle + sluitknop */}
        <div className="flex items-center justify-between pt-3 pb-1 px-5">
          <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto" />
          <button
            onClick={onClose}
            className="absolute right-5 top-4 text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            Annuleren
          </button>
        </div>

        {mode === "list" ? (
          <>
            <div className="px-5 pt-3 pb-2">
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                {title}
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                {subtitle}
              </p>
            </div>

            {/* Scrollable list */}
            <div className="px-3 overflow-y-auto max-h-[45vh]">
              {allCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onSelect(cat.id)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 active:bg-stone-100 dark:active:bg-stone-700 transition-colors text-left"
                >
                  <span className="text-xl shrink-0">{cat.icon}</span>
                  <span className="text-sm font-medium text-stone-800 dark:text-stone-200">{cat.name}</span>
                </button>
              ))}
            </div>

            {/* New category — always at bottom */}
            <div className="px-3 pb-8 pt-1 border-t border-stone-100 dark:border-stone-700">
              <button
                onClick={() => setMode("new")}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-stone-50 active:bg-stone-100 transition-colors text-left"
              >
                <span className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-400 text-base shrink-0">+</span>
                <span className="text-sm font-medium text-stone-500 dark:text-stone-400">Nieuwe categorie aanmaken</span>
              </button>
            </div>
          </>
        ) : (
          <div className="px-5 pt-3 pb-8 overflow-y-auto">
            {!isEditing && (
              <button
                onClick={() => setMode("list")}
                className="text-xs text-stone-400 mb-3 hover:text-stone-600 transition-colors"
              >
                ← Terug
              </button>
            )}
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
              {isEditing ? "Categorie bewerken" : "Nieuwe categorie"}
            </p>

            <p className="text-xs text-stone-400 dark:text-stone-500 mb-2 uppercase tracking-widest font-semibold">Icoon</p>
            <div className="flex flex-wrap gap-2 mb-4 max-h-44 overflow-y-auto">
              {QUICK_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setNewIcon(emoji)}
                  className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all ${
                    newIcon === emoji ? "bg-stone-900 scale-105" : "bg-stone-100 hover:bg-stone-200"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <p className="text-xs text-stone-400 dark:text-stone-500 mb-2 uppercase tracking-widest font-semibold">Naam</p>
            <input
              ref={nameInputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="bijv. Musea, Strand, Zakelijk…"
              maxLength={30}
              className="w-full bg-stone-50 dark:bg-stone-800 rounded-xl px-4 py-3 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-600 outline-none focus:ring-1 focus:ring-stone-300 dark:focus:ring-stone-600 transition mb-4"
            />

            <button
              onClick={handleSave}
              disabled={!newName.trim() || saving}
              className="w-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl py-3 text-sm font-medium disabled:opacity-30 active:scale-95 transition-all"
            >
              {saving ? "Opslaan…" : isEditing ? "Opslaan" : "Aanmaken en opslaan"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
