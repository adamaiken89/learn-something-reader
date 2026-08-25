import { Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/shadcn/button';

import { useLessonUIStore } from '../../stores/lessonUIStore';
import { useSettingsStore } from '../../stores/settingsStore';

function FocusPomodoroControls() {
  const { t } = useTranslation();
  const focusMode = useSettingsStore((s) => s.focusMode);
  const toggleFocusMode = useSettingsStore((s) => s.toggleFocusMode);
  const showPomodoro = useLessonUIStore((s) => s.showPomodoro);
  const togglePomodoro = useLessonUIStore((s) => s.togglePomodoro);

  return (
    <>
      <Button
        variant={focusMode ? 'toggleActive' : 'toggle'}
        size="sm"
        onClick={toggleFocusMode}
        title={t('lesson.focusMode')}
      >
        {focusMode ? t('lesson.focusModeOn') : t('lesson.focusModeOff')}
      </Button>
      <Button
        variant={showPomodoro ? 'toggleActive' : 'toggle'}
        size="sm"
        onClick={togglePomodoro}
        title={t('pomodoro.title')}
      >
        <Timer size={14} />
      </Button>
    </>
  );
}

export default FocusPomodoroControls;
