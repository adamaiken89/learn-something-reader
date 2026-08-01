import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/shallow';

import type { ContentWidth, TransitionStyle } from '../../stores/settingsStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { THEME_ICONS, THEME_LABELS, THEMES } from '../../themes';

const TRANSITION_LABELS: Record<TransitionStyle, string> = {
  none: 'settings.transitionNone',
  slide: 'settings.transitionSlide',
  flip: 'settings.transitionFlip',
  fade: 'settings.transitionFade',
};

const WIDTH_LABELS: Record<ContentWidth, string> = {
  narrow: 'lesson.narrow',
  standard: 'lesson.standard',
  wide: 'lesson.wide',
  full: 'lesson.full',
};

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
        active
          ? 'bg-indigo-700/50 border-indigo-500 text-indigo-200'
          : 'bg-gray-800/60 border-gray-600/50 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

export default function AppearanceSection() {
  const { t } = useTranslation();

  const {
    fontSize,
    incFontSize,
    decFontSize,
    theme,
    setTheme,
    contentWidth,
    setContentWidth,
    transitionStyle,
    setTransitionStyle,
  } = useSettingsStore(
    useShallow((s) => ({
      fontSize: s.fontSize,
      incFontSize: s.incFontSize,
      decFontSize: s.decFontSize,
      theme: s.theme,
      setTheme: s.setTheme,
      contentWidth: s.contentWidth,
      setContentWidth: s.setContentWidth,
      transitionStyle: s.transitionStyle,
      setTransitionStyle: s.setTransitionStyle,
    })),
  );

  return (
    <section className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">{t('settings.readingTheme')}</h3>

      {/* Theme Grid */}
      <div className="mb-5">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {t('settings.readingTheme')}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((th) => (
            <button
              key={th}
              onClick={() => setTheme(th)}
              className={`rounded-lg p-2 text-center transition-colors ${
                theme === th ? 'ring-1 ring-indigo-500 bg-indigo-900/20' : 'hover:bg-gray-700/50'
              }`}
            >
              <div className="text-base">{t(THEME_ICONS[th])}</div>
              <div className="text-[10px] text-gray-400 leading-tight mt-0.5 truncate">
                {t(THEME_LABELS[th])}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="mb-5">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {t('settings.fontSize')}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={decFontSize}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 border border-gray-600/50 text-gray-300 hover:bg-gray-600 text-sm transition-colors"
          >
            A⁻
          </button>
          <span className="w-8 text-center text-sm text-gray-300 tabular-nums">{fontSize}</span>
          <button
            onClick={incFontSize}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 border border-gray-600/50 text-gray-300 hover:bg-gray-600 text-sm transition-colors"
          >
            A⁺
          </button>
        </div>
      </div>

      {/* Content Width */}
      <div className="mb-5">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {t('settings.contentWidth')}
        </div>
        <div className="flex gap-2">
          {(['narrow', 'standard', 'wide', 'full'] as ContentWidth[]).map((w) => (
            <Pill
              key={w}
              label={t(WIDTH_LABELS[w])}
              active={contentWidth === w}
              onClick={() => setContentWidth(w)}
            />
          ))}
        </div>
      </div>

      {/* Page Transition */}
      <div>
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {t('settings.pageTransition')}
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['none', 'slide', 'flip', 'fade'] as TransitionStyle[]).map((ts) => (
            <Pill
              key={ts}
              label={t(TRANSITION_LABELS[ts])}
              active={transitionStyle === ts}
              onClick={() => setTransitionStyle(ts)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
