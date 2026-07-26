import { useTranslation } from 'react-i18next';

import { useCurrentLesson } from '../../hooks/useCurrentLesson';
import { useCourseStore } from '../../stores/courseStore';
import { useViewStore } from '../../stores/viewStore';

function CardsButton() {
  const { t } = useTranslation();
  const { course } = useCurrentLesson();
  const courses = useCourseStore((s) => s.courses);
  const push = useViewStore((s) => s.push);

  return (
    <button
      className="px-2 py-1 text-[11px] rounded bg-gray-700/50 border border-gray-600/50 text-gray-400 hover:bg-gray-600/50 hover:text-gray-200 transition-colors"
      onClick={() => {
        if (!course) return;
        const found = courses.find((c) => c.id === course.id);
        if (found) push({ type: 'review', course: found });
      }}
      title={t('lesson.reviewFlashcards')}
    >
      {t('lesson.cards')}
    </button>
  );
}

export default CardsButton;
