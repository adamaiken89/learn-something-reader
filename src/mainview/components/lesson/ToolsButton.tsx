import { useTranslation } from 'react-i18next';

import { useLessonUIStore } from '../../stores/lessonUIStore';
import { Button } from '../ui';

function ToolsButton() {
  const { t } = useTranslation();
  const showTools = useLessonUIStore((s) => s.showTools);
  const toggleTools = useLessonUIStore((s) => s.toggleTools);

  return (
    <Button
      variant={showTools ? 'toggleActive' : 'toggle'}
      size="sm"
      onClick={toggleTools}
      title={t('lesson.toggleStudyTools')}
    >
      {t('lesson.tools')}
    </Button>
  );
}

export default ToolsButton;
