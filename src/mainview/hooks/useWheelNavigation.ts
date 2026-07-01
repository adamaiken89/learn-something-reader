import { useEffect } from 'react';

interface UseWheelNavigationOpts {
  contentRef: React.RefObject<HTMLDivElement | null>;
  nav: { hasPrev: boolean; hasNext: boolean; goPrev: () => void; goNext: () => void };
}

export function useWheelNavigation({ contentRef, nav }: UseWheelNavigationOpts) {
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);
      if (absX > 40 && absX > absY * 1.5) {
        e.preventDefault();
        if (e.deltaX > 0 && nav.hasNext) nav.goNext();
        else if (e.deltaX < 0 && nav.hasPrev) nav.goPrev();
      }
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [nav, contentRef]);
}
