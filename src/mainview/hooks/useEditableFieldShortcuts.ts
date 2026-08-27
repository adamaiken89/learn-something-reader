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

function selectAll(el: Element): void {
  if ('select' in el) {
    (el as HTMLInputElement | HTMLTextAreaElement).select();
  }
}

function copySelection(): void {
  if (!navigator.clipboard?.writeText) throw new Error('Clipboard API not available');
  const text = window.getSelection()?.toString();
  if (text) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

export function useEditableFieldShortcuts(): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;
      const el = document.activeElement;
      if (!el || !isEditable(el)) return;

      const key = e.key.toLowerCase();

      if (key === 'a') {
        e.preventDefault();
        selectAll(el);
        return;
      }

      if (key === 'c') {
        e.preventDefault();
        copySelection();
      }
    };

    window.addEventListener('keydown', handler, { capture: true });
    return () => window.removeEventListener('keydown', handler, { capture: true });
  }, []);
}
