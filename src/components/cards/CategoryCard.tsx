import Link from "next/link";
import { Category } from "@/types";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/category/${category.id}`} className="block">
      <div className="bg-white dark:bg-stone-900 rounded-2xl px-4 py-4 flex items-center gap-3 active:scale-95 transition-transform duration-150">
        <span className="text-2xl shrink-0">{category.icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
            {category.name}
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500 truncate mt-0.5">
            {category.description}
          </p>
        </div>
        <span className="ml-auto text-stone-300 dark:text-stone-600 text-sm shrink-0">›</span>
      </div>
    </Link>
  );
}
