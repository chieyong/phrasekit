"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import LanguageSelector from "@/components/ui/LanguageSelector";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

export default function Header({
  title,
  showBack = false,
  subtitle,
  rightElement,
}: HeaderProps) {
  const router = useRouter();
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const { theme, toggle } = useTheme();

  const authButton = !loading && (
    user ? (
      <button
        onClick={signOut}
        className="flex items-center gap-1.5 bg-white dark:bg-stone-800 rounded-xl px-2.5 py-1.5 shadow-sm active:opacity-70 transition-opacity"
      >
        {user.photoURL && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photoURL} alt="" className="w-4 h-4 rounded-full" />
        )}
        <span className="text-xs text-stone-500 dark:text-stone-400">Uitloggen</span>
      </button>
    ) : (
      <button
        onClick={signInWithGoogle}
        className="flex items-center gap-1.5 bg-white dark:bg-stone-800 rounded-xl px-2.5 py-1.5 shadow-sm active:opacity-70 transition-opacity"
      >
        <span className="text-sm font-medium text-stone-600 dark:text-stone-300">G</span>
        <span className="text-xs text-stone-700 dark:text-stone-300">Inloggen</span>
      </button>
    )
  );

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg)]/90 backdrop-blur-md">
      <div className="max-w-md mx-auto flex items-center gap-3 px-5 py-4">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 active:scale-95 transition-all shrink-0 text-xl leading-none pb-0.5"
            aria-label="Terug"
          >
            ←
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1
            className={`font-semibold text-stone-900 dark:text-stone-100 truncate ${
              subtitle ? "text-sm" : "text-base"
            }`}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-stone-400 dark:text-stone-500 truncate mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {/* Taal-kiezer */}
          <LanguageSelector compact />

          {/* Donker/licht toggle */}
          <button
            onClick={toggle}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
            aria-label={theme === "dark" ? "Schakel naar licht" : "Schakel naar donker"}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>

          {rightElement
            ? rightElement
            : authButton
          }
        </div>
      </div>
      <div className="h-px bg-stone-200/60 dark:bg-stone-700/60 mx-5" />
    </header>
  );
}
