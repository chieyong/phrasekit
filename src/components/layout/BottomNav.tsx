"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", icon: "⊞" },
  { href: "/ask", label: "Vraag", icon: "✦", featured: true },
  { href: "/favorites", label: "Opgeslagen", icon: "◇" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-100 dark:border-stone-800 safe-area-bottom">
      <div className="max-w-md mx-auto flex items-stretch h-14">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative group"
              aria-label={item.label}
            >
              <span className={`text-base transition-colors ${isActive ? "text-stone-900 dark:text-stone-100" : "text-stone-400 dark:text-stone-500 group-hover:text-stone-600 dark:group-hover:text-stone-300"}`}>
                {item.icon}
              </span>
              <span className={`text-[9px] font-medium tracking-wide uppercase transition-colors ${isActive ? "text-stone-900 dark:text-stone-100" : "text-stone-400 dark:text-stone-500"}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-stone-900 dark:bg-stone-100 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
