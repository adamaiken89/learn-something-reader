import { create } from "zustand";

export type Theme = "dark" | "sepia" | "light";

const THEMES: Theme[] = ["dark", "sepia", "light"];

function getStored<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key)!) ?? fallback; } catch { return fallback; }
}
function store(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* noop */ }
}

interface SettingsState {
  fontSize: number;
  theme: Theme;
  hasApiKey: boolean;
  incFontSize: () => void;
  decFontSize: () => void;
  setFontSize: (v: number) => void;
  cycleTheme: () => void;
  setTheme: (t: Theme) => void;
  setHasApiKey: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  fontSize: getStored<number>("coursereader-fontsize", 16),
  theme: getStored<Theme>("coursereader-theme", "dark"),
  hasApiKey: false,

  incFontSize: () =>
    set((s) => {
      const next = Math.min(28, s.fontSize + 2);
      store("coursereader-fontsize", next);
      return { fontSize: next };
    }),

  decFontSize: () =>
    set((s) => {
      const next = Math.max(10, s.fontSize - 2);
      store("coursereader-fontsize", next);
      return { fontSize: next };
    }),

  setFontSize: (v) => {
    store("coursereader-fontsize", v);
    set({ fontSize: v });
  },

  cycleTheme: () =>
    set((s) => {
      const idx = THEMES.indexOf(s.theme);
      const next = THEMES[(idx + 1) % THEMES.length];
      store("coursereader-theme", next);
      return { theme: next };
    }),

  setTheme: (t) => {
    store("coursereader-theme", t);
    set({ theme: t });
  },

  setHasApiKey: (v) => set({ hasApiKey: v }),
}));
