"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

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

  const authButton = !loading && (
    user ? (
      <button
        onClick={signOut}
        className="flex items-center gap-1.5 bg-white rounded-xl px-2.5 py-1.5 shadow-sm active:opacity-70 transition-opacity"
      >
        {user.photoURL && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photoURL} alt="" className="w-4 h-4 rounded-full" />
        )}
        <span className="text-xs text-stone-500">Uitloggen</span>
      </button>
    ) : (
      <button
        onClick={signInWithGoogle}
        className="flex items-center gap-1.5 bg-white rounded-xl px-2.5 py-1.5 shadow-sm active:opacity-70 transition-opacity"
      >
        <span className="text-sm font-medium text-stone-600">G</span>
        <span className="text-xs text-stone-700">Inloggen</span>
      </button>
    )
  );

  return (
    <header className="sticky top-0 z-40 bg-[#f5f2ee]/90 backdrop-blur-md">
      <div className="max-w-md mx-auto flex items-center gap-3 px-5 py-4">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="text-stone-400 hover:text-stone-700 active:scale-95 transition-all shrink-0 text-xl leading-none pb-0.5"
            aria-label="Terug"
          >
            ←
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1
            className={`font-semibold text-stone-900 truncate ${
              subtitle ? "text-sm" : "text-base"
            }`}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-stone-400 truncate mt-0.5">{subtitle}</p>
          )}
        </div>
        {rightElement
          ? <div className="shrink-0">{rightElement}</div>
          : <div className="shrink-0">{authButton}</div>
        }
      </div>
      {/* Hairline separator */}
      <div className="h-px bg-stone-200/60 mx-5" />
    </header>
  );
}
