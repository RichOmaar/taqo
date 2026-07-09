import type { ReactNode } from 'react';

import { cn } from '../utils/cn';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

/** Mobile-friendly bottom sheet with a soft backdrop. Presentational only. */
export function BottomSheet({ open, onClose, children, className }: BottomSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full max-w-lg rounded-t-[32px] bg-surface p-6 shadow-soft',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
