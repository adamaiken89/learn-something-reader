import { useTranslation } from 'react-i18next';

import { selectableCardVariants } from '@/lib/card-styles';

import { useSettingsStore } from '../../stores/settingsStore';

const LOCALES = [
  { code: 'en-US', labelKey: 'settings.englishUS' },
  { code: 'en-GB', labelKey: 'settings.englishUK' },
  { code: 'zh-TW', labelKey: 'settings.chineseTW' },
  { code: 'zh-CN', labelKey: 'settings.chineseCN' },
];

export default function LanguageSection() {
  const { t } = useTranslation();
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);

  return (
    <section className="bg-gray-800 rounded-xl p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('settings.language')}</h3>
        <div className="flex flex-wrap gap-2">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLocale(l.code)}
              className={selectableCardVariants({ selected: locale === l.code })}
            >
              {t(l.labelKey)}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
