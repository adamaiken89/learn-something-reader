import { Timer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Course } from '../../../bun/types';
import { api } from '../../api';
import { useCourseStore } from '../../stores/courseStore';
import { useViewStore } from '../../stores/viewStore';

export default function LessonWarmUpBar({ courseId }: { courseId: string }) {
  const { t } = useTranslation();
  const push = useViewStore((s) => s.push);
  const courses = useCourseStore((s) => s.courses);
  const [dueCount, setDueCount] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const dismissKey = `coursereader-warmup-${courseId}`;
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const stored = localStorage.getItem(dismissKey);
    if (stored === today) {
      setDismissed(true);
      return;
    }
    api.courses.srs
      .dueCount(courseId)
      .then(setDueCount)
      .catch(() => setDueCount(0));
  }, [courseId, dismissKey, today]);

  const handleDismiss = () => {
    localStorage.setItem(dismissKey, today);
    setDismissed(true);
  };

  const handleReview = () => {
    const course = courses.find((c: Course) => c.id === courseId);
    if (course) push({ type: 'review', course });
  };

  if (dismissed || dueCount === null || dueCount === 0) return null;

  return (
    <div className="mx-3 sm:mx-6 mb-2 bg-gray-800/80 border border-amber-700/50 rounded-lg px-3 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Timer size={14} className="text-amber-400 shrink-0" />
        <span className="text-xs text-amber-400">
          {t('lesson.warmUpCount', { count: dueCount })}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleReview}
          className="px-2.5 py-1 text-[10px] font-medium bg-indigo-600 hover:bg-indigo-500 rounded transition-colors text-white"
        >
          {t('lesson.warmUpReview')}
        </button>
        <button
          onClick={handleDismiss}
          className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          {t('lesson.warmUpDismiss')}
        </button>
      </div>
    </div>
  );
}
