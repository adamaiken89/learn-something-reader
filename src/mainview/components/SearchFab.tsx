import { useTranslation } from 'react-i18next';

import { useSettingsStore } from '../stores/settingsStore';

interface Props {
  onClick: () => void;
}

export default function SearchFab({ onClick }: Props) {
  const { t } = useTranslation();
  const focusMode = useSettingsStore((s) => s.focusMode);

  if (focusMode) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 left-4 z-50 w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 shadow-lg flex items-center justify-center text-white transition-colors"
      title={t('app.search')}
    >
      {t('icons.search')}
    </button>
  );
}
