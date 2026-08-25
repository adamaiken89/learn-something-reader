import { useRef, useState } from 'react';

import { Sheet, SheetContent, SheetTitle } from '@/components/shadcn/sheet';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/**
 * Mobile bottom sheet over shadcn Sheet primitives. Preserves the legacy
 * BottomSheet API ({open, onClose, title, children}) plus the drag-to-dismiss
 * gesture. Consumers gate rendering behind their own `isMobile` checks.
 */
export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStart.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStart.current === null) return;
    const delta = e.touches[0].clientY - dragStart.current;
    if (delta > 0) setDragY(delta);
  };

  const handleTouchEnd = () => {
    if (dragY > 100) onClose();
    setDragY(0);
    dragStart.current = null;
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="bottom"
        className="flex flex-col gap-0 rounded-t-2xl border-t border-gray-700 bg-gray-900 max-h-[85vh] p-0 md:hidden safe-area-bottom"
        style={
          dragY !== 0 ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined
        }
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-1 rounded-full bg-gray-600 mx-auto md:hidden" />
            {title ? (
              <SheetTitle className="text-sm font-medium text-gray-200">{title}</SheetTitle>
            ) : (
              <SheetTitle className="sr-only">Panel</SheetTitle>
            )}
          </div>
        </div>
        <div className="overflow-y-auto flex-1 overscroll-contain">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
