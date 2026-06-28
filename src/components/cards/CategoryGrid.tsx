"use client";

import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface GridCategory {
  id: string;
  name: string;
  icon: string;
}

// ─── Tegels ────────────────────────────────────────────────────────────────────

function NavTile({ cat }: { cat: GridCategory }) {
  return (
    <Link href={`/category/${cat.id}`} className="block">
      <div className="bg-white dark:bg-stone-900 rounded-2xl px-3.5 py-3.5 flex items-center gap-2.5 active:scale-95 transition-transform duration-150">
        <span className="text-2xl shrink-0">{cat.icon}</span>
        <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{cat.name}</p>
      </div>
    </Link>
  );
}

function SortableTile({ cat }: { cat: GridCategory }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex:  isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white dark:bg-stone-900 rounded-2xl px-3.5 py-3.5 flex items-center gap-2 touch-none cursor-grab active:cursor-grabbing ring-1 ring-stone-200 dark:ring-stone-700"
    >
      <span className="text-base text-stone-300 dark:text-stone-600 shrink-0 select-none">⠿</span>
      <span className="text-2xl shrink-0">{cat.icon}</span>
      <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{cat.name}</p>
    </div>
  );
}

// ─── Grid ───────────────────────────────────────────────────────────────────────

export default function CategoryGrid({
  categories,
  reordering,
  onReorder,
}: {
  categories: GridCategory[];
  reordering: boolean;
  onReorder: (orderedIds: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(categories, oldIndex, newIndex).map((c) => c.id));
  };

  if (!reordering) {
    return (
      <div className="grid grid-cols-2 gap-1.5">
        {categories.map((cat) => (
          <NavTile key={cat.id} cat={cat} />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={categories.map((c) => c.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-1.5">
          {categories.map((cat) => (
            <SortableTile key={cat.id} cat={cat} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
