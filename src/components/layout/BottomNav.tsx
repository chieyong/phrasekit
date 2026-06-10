"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/",         label: "Home",      icon: "⊞",  featured: false },
  { href: "/ask",      label: "Vertalen",  icon: "+",   featured: true  },
  { href: "/favorites", label: "Opgeslagen", icon: "♡", featured: false },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-100 dark:border-stone-800 safe-area-bottom">
      <div className="max-w-md mx-auto flex items-stretch h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          if (item.featured) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center justify-center gap-1 relative group"
                aria-label={item.label}
              >
                <span className={`w-11 h-11 rounded-full flex items-center justify-center text-xl font-light transition-all active:scale-90 ${
                  isActive
                    ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                    : "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 group-hover:opacity-80"
                }`}>
                  {item.icon}
                </span>
                <span className={`text-[9px] font-medium tracking-wide uppercase transition-colors ${
                  isActive ? "text-stone-900 dark:text-stone-100" : "text-stone-400 dark:text-stone-500"
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative group"
              aria-label={item.label}
            >
              <span className={`text-lg transition-colors ${
                isActive
                  ? "text-stone-900 dark:text-stone-100"
                  : "text-stone-400 dark:text-stone-500 group-hover:text-stone-600 dark:group-hover:text-stone-300"
              }`}>
                {item.icon}
              </span>
              <span className={`text-[9px] font-medium tracking-wide uppercase transition-colors ${
                isActive ? "text-stone-900 dark:text-stone-100" : "text-stone-400 dark:text-stone-500"
              }`}>
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
