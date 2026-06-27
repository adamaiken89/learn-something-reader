import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enAU from './locales/en-AU.json';
import enCA from './locales/en-CA.json';
import enGB from './locales/en-GB.json';
import enUS from './locales/en-US.json';
import zhTW from './locales/zh-TW.json';

const supported = ['en-US', 'en-GB', 'en-CA', 'en-AU', 'zh-TW'];

let detected = 'en-US';
try {
  const stored = localStorage.getItem('coursereader-locale');
  detected = stored ?? (supported.includes(navigator.language) ? navigator.language : 'en-US');
} catch {
  /* ignore */
}

void i18n.use(initReactI18next).init({
  resources: {
    'en-US': { translation: enUS },
    'en-GB': { translation: enGB },
    'en-CA': { translation: enCA },
    'en-AU': { translation: enAU },
    'zh-TW': { translation: zhTW },
  },
  lng: detected,
  fallbackLng: {
    default: ['en-US'],
  },
  interpolation: {
    escapeValue: false,
  },
});

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof enUS;
    };
  }
}

export default i18n;
