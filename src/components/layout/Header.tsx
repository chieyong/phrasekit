"use client";

import { useRouter } from "next/navigation";

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
        {rightElement && <div className="shrink-0">{rightElement}</div>}
      </div>
      {/* Hairline separator */}
      <div className="h-px bg-stone-200/60 mx-5" />
    </header>
  );
}
