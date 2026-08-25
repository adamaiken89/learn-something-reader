import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/shadcn/button';

import { api } from '../../api';
import { showToast } from '../../toast';

type ConfirmState = 'clearData' | 'clearLogs' | null;

export default function DangerSection() {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState<ConfirmState>(null);

  const handleClear = async () => {
    if (confirming !== 'clearData') {
      setConfirming('clearData');
      setTimeout(() => setConfirming(null), 5000);
      return;
    }
    await api.storage.clearAll();
    showToast.success('settings.clearDataSuccess');
    window.location.reload();
  };

  const handleClearLogs = async () => {
    if (confirming !== 'clearLogs') {
      setConfirming('clearLogs');
      setTimeout(() => setConfirming(null), 5000);
      return;
    }
    await api.storage.clearLogs();
    showToast.success('settings.clearLogsSuccess');
    setConfirming(null);
  };

  return (
    <section className="bg-red-900/30 border border-red-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 text-red-400">{t('settings.dangerZone')}</h3>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-400 mb-4">{t('settings.clearDataDesc')}</p>
          <Button
            variant="danger"
            size="lg"
            onClick={() => {
              void handleClear();
            }}
          >
            {confirming === 'clearData'
              ? t('settings.confirmClearData')
              : t('settings.clearAllData')}
          </Button>
        </div>
        <div>
          <p className="text-sm text-gray-400 mb-4">{t('settings.clearLogsDesc')}</p>
          <Button
            variant="danger"
            size="lg"
            onClick={() => {
              void handleClearLogs();
            }}
          >
            {confirming === 'clearLogs' ? t('settings.confirmClearLogs') : t('settings.clearLogs')}
          </Button>
        </div>
      </div>
    </section>
  );
}
