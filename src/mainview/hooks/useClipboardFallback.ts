import { useEffect } from 'react';

function isEditable(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    el.getAttribute('role') === 'textbox' ||
    (el as HTMLElement).isContentEditable
  );
}

function exec(cmd: string, el: Element): void {
  try {
    const ok = document.execCommand(cmd);
    if (ok) return;
  } catch {
    /* execCommand threw */
  }
  if (cmd === 'selectAll' && 'select' in el) {
    (el as HTMLInputElement | HTMLTextAreaElement).select();
  }
}

export function useClipboardFallback(): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;
      const el = document.activeElement;
      if (!el || !isEditable(el)) return;

      const key = e.key.toLowerCase();

      if (key === 'a') {
        e.preventDefault();
        exec('selectAll', el);
        return;
      }

      if (key === 'c') {
        e.preventDefault();
        exec('copy', el);
      }
    };

    window.addEventListener('keydown', handler, { capture: true });
    return () => window.removeEventListener('keydown', handler, { capture: true });
  }, []);
}
