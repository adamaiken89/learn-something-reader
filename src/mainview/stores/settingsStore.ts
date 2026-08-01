import { create } from 'zustand';

import i18n from '../i18n';
import type { Theme } from '../themes';
import { THEMES } from '../themes';
import { getStored, store } from './storageUtils';

export type ContentWidth = 'narrow' | 'standard' | 'wide' | 'full';
export type TransitionStyle = 'none' | 'flip' | 'slide' | 'fade';
export type ReadingMode = 'normal' | 'active';
export type RightPanel = false | 'sections' | 'ai' | 'notes';

interface SettingsState {
  fontSize: number;
  theme: Theme;
  contentWidth: ContentWidth;
  rightPanel: RightPanel;
  focusMode: boolean;
  locale: string;
  transitionStyle: TransitionStyle;
  readingMode: ReadingMode;
  aiShareConsent: boolean;
  incFontSize: () => void;
  decFontSize: () => void;
  setFontSize: (v: number) => void;
  cycleTheme: () => void;
  setTheme: (t: Theme) => void;
  setContentWidth: (v: ContentWidth) => void;
  setRightPanel: (v: RightPanel) => void;
  toggleFocusMode: () => void;
  setLocale: (l: string) => void;
  setTransitionStyle: (v: TransitionStyle) => void;
  setReadingMode: (v: ReadingMode) => void;
  setAiShareConsent: (v: boolean) => void;
}

const migrateWidth = (): ContentWidth => {
  const saved = getStored<unknown>('coursereader-width', undefined);
  if (saved === 'narrow' || saved === 'standard' || saved === 'wide' || saved === 'full')
    return saved;
  const legacy = getStored<boolean | undefined>('coursereader-wide', undefined);
  if (legacy === true) return 'wide';
  if (legacy === false) return 'narrow';
  return 'standard';
};

const migrateRightPanel = (): RightPanel => {
  const saved = getStored<unknown>('coursereader-rightpanel', undefined);
  if (saved === 'sections' || saved === 'ai' || saved === 'notes') return saved;
  if (saved === false) return false;
  const old = getStored<unknown>('coursereader-sections', undefined);
  if (old === true) return 'sections';
  if (old === false) return false;
  return 'sections';
};

export const useSettingsStore = create<SettingsState>((set) => ({
  fontSize: getStored<number>('coursereader-fontsize', 16),
  theme: getStored<Theme>('coursereader-theme', 'dark'),
  contentWidth: migrateWidth(),
  rightPanel: migrateRightPanel(),
  focusMode: getStored<boolean>('coursereader-focus', false),
  locale: localStorage.getItem('coursereader-locale') || 'en-US',
  transitionStyle: getStored<TransitionStyle>('coursereader-transition', 'none'),
  readingMode: getStored<ReadingMode>('coursereader-reading-mode', 'normal'),
  aiShareConsent: getStored<boolean>('coursereader-ai-consent', false),
  incFontSize: () =>
    set((s) => {
      const next = Math.min(28, s.fontSize + 2);
      store('coursereader-fontsize', next);
      return { fontSize: next };
    }),

  decFontSize: () =>
    set((s) => {
      const next = Math.max(10, s.fontSize - 2);
      store('coursereader-fontsize', next);
      return { fontSize: next };
    }),

  setFontSize: (v) => {
    store('coursereader-fontsize', v);
    set({ fontSize: v });
  },

  cycleTheme: () =>
    set((s) => {
      const idx = THEMES.indexOf(s.theme);
      const next = THEMES[(idx + 1) % THEMES.length];
      store('coursereader-theme', next);
      return { theme: next };
    }),

  setTheme: (t) => {
    store('coursereader-theme', t);
    set({ theme: t });
  },

  setContentWidth: (v) => {
    store('coursereader-width', v);
    set({ contentWidth: v });
  },

  setRightPanel: (v) => {
    store('coursereader-rightpanel', v);
    set({ rightPanel: v });
  },

  toggleFocusMode: () =>
    set((s) => {
      const next = !s.focusMode;
      store('coursereader-focus', next);
      return { focusMode: next };
    }),

  setLocale: (l) => {
    localStorage.setItem('coursereader-locale', l);
    void i18n.changeLanguage(l);
    set({ locale: l });
  },

  setTransitionStyle: (v) => {
    store('coursereader-transition', v);
    set({ transitionStyle: v });
  },

  setReadingMode: (v) => {
    store('coursereader-reading-mode', v);
    set({ readingMode: v });
  },
  setAiShareConsent: (v) => {
    store('coursereader-ai-consent', v);
    set({ aiShareConsent: v });
  },
}));
