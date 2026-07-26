import { useTranslation } from 'react-i18next';

import { api } from '../../api';
import { useCompletionStore } from '../../stores/completionStore';
import { useLessonViewStore } from '../../stores/lessonViewStore';
import { Button } from '../ui/Button';

export default function LessonContentCompletionButton() {
  const { t } = useTranslation();
  const courseId = useLessonViewStore((s) => s.courseId);
  const moduleId = useLessonViewStore((s) => s.moduleId);
  const isCompleted = useCompletionStore((s) => s.getEffectiveCompleted(courseId, moduleId));

  return (
    <Button
      onClick={() => {
        void handleToggle();
      }}
      data-testid="complete-btn"
      variant="outline"
      className={`font-sans ${
        isCompleted
          ? 'border-green-500/50 text-green-500 hover:border-green-500 hover:text-green-400'
          : ''
      }`}
    >
      {isCompleted ? t('lesson.completed') : t('lesson.markAsComplete')}
    </Button>
  );
}

export async function handleToggle() {
  const courseId = useLessonViewStore.getState().courseId;
  const moduleId = useLessonViewStore.getState().moduleId;
  const wasCompleted = useCompletionStore.getState().getEffectiveCompleted(courseId, moduleId);
  await useCompletionStore.getState().toggle(courseId, moduleId);
  if (!wasCompleted) {
    api.stats
      .logSession({
        courseID: courseId,
        moduleID: moduleId,
        durationMinutes: 10,
        type: 'reading',
      })
      .catch(() => {});
  }
}
