import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "soft" | "outline";
  className?: string;
}

export default function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  const variants = {
    default: "bg-stone-100 text-stone-600",
    soft: "bg-amber-50 text-amber-700",
    outline: "border border-stone-200 text-stone-500",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
