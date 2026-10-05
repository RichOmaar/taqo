'use client';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';

import { cn } from '../utils/cn';

export interface SortableListProps<Item> {
  items: Item[];
  /** Stable identity per item; reordering is expressed in these. */
  getId: (item: Item) => string;
  /** Called with the reordered list. */
  onReorder: (items: Item[]) => void;
  children: (item: Item, index: number) => ReactNode;
  /** Announced to screen readers as the thing being reordered. */
  label: string;
  className?: string;
}

/**
 * A reorderable list with two equal affordances.
 *
 * Dragging is the obvious one and the only one the mock shows. It is also the
 * one that does not work with a keyboard, on a screen reader, or reliably on a
 * touchscreen — so every row also carries move-up and move-down buttons. They
 * are not a fallback: they are frequently the faster way to move one row by one
 * position, which is most reorders.
 */
export function SortableList<Item>({
  items,
  getId,
  onReorder,
  children,
  label,
  className,
}: SortableListProps<Item>) {
  const sensors = useSensors(
    // A small distance threshold keeps a click on a button inside the row from
    // being swallowed as the start of a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = items.map(getId);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;

    onReorder(arrayMove(items, from, to));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    onReorder(arrayMove(items, index, target));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className={cn('flex list-none flex-col gap-3 p-0', className)} aria-label={label}>
          {items.map((item, index) => (
            <SortableRow
              key={getId(item)}
              id={getId(item)}
              position={index + 1}
              total={items.length}
              label={label}
              onMoveUp={() => move(index, -1)}
              onMoveDown={() => move(index, 1)}
            >
              {children(item, index)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

interface SortableRowProps {
  id: string;
  position: number;
  total: number;
  label: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  children: ReactNode;
}

function SortableRow({
  id,
  position,
  total,
  label,
  onMoveUp,
  onMoveDown,
  children,
}: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-start gap-2 rounded-xl bg-surface p-3 shadow-soft',
        isDragging && 'relative z-10 opacity-80',
      )}
    >
      <div className="flex flex-col items-center gap-1 pt-1">
        {/* The drag handle is the only draggable part, so text inside the row
            stays selectable. */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Arrastrar para reordenar: ${label} ${position}`}
          className="cursor-grab rounded px-1 text-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary active:cursor-grabbing"
        >
          ⠿
        </button>

        <button
          type="button"
          onClick={onMoveUp}
          disabled={position === 1}
          aria-label={`Subir: ${label} ${position} de ${total}`}
          className="rounded px-1 text-xs text-muted hover:text-foreground disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={position === total}
          aria-label={`Bajar: ${label} ${position} de ${total}`}
          className="rounded px-1 text-xs text-muted hover:text-foreground disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        >
          ▼
        </button>
      </div>

      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}
