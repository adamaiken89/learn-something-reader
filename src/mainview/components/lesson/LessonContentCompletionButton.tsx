import { useTranslation } from 'react-i18next';

import { COMPLETION_GREEN, COMPLETION_GREEN_DARK, SECTION_ACTIVE_TEXT } from '../../colors';
import { useCompletionStore } from '../../stores/completionStore';
import { useLessonViewStore } from '../../stores/lessonViewStore';

export default function LessonContentCompletionButton() {
  const { t } = useTranslation();
  const courseId = useLessonViewStore((s) => s.courseId);
  const moduleId = useLessonViewStore((s) => s.moduleId);
  const isCompleted = useCompletionStore((s) => s.getEffectiveCompleted(courseId, moduleId));
  const toggle = useCompletionStore((s) => s.toggle);

  return (
    <div style={{ marginTop: '3rem' }}>
      <button
        onClick={() => {
          void toggle(courseId, moduleId);
        }}
        data-testid="complete-btn"
        className="w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200"
        style={{
          background: isCompleted
            ? `linear-gradient(135deg, ${COMPLETION_GREEN}, ${COMPLETION_GREEN_DARK})`
            : 'var(--book-code-bg)',
          color: isCompleted ? SECTION_ACTIVE_TEXT : 'var(--book-text)',
          border: `1px solid ${isCompleted ? COMPLETION_GREEN_DARK : 'var(--book-h2-border)'}`,
        }}
      >
        {isCompleted ? t('lesson.completed') : t('lesson.markAsComplete')}
      </button>
    </div>
  );
}
