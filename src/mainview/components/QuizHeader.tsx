import { ListChecks } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import PageHeader from '../layouts/PageHeader';
import { useViewStore } from '../stores/viewStore';
import CourseSwitcher from './CourseSwitcher';

interface QuizHeaderProps {
  onBack: () => void;
  currentCourseId: string;
  title?: string;
  onAllQuizzes?: () => void;
}

export default function QuizHeader({
  onBack,
  currentCourseId,
  title,
  onAllQuizzes,
}: QuizHeaderProps) {
  const replace = useViewStore((s) => s.replace);
  const { t } = useTranslation();
  return (
    <PageHeader
      onBack={onBack}
      title={title}
      center={
        <div className="flex items-center gap-2">
          <CourseSwitcher
            currentCourseId={currentCourseId}
            onSelect={(c) => replace({ type: 'lesson', course: c, module: c.modules[0] })}
          />
          {onAllQuizzes && (
            <button
              onClick={onAllQuizzes}
              title={t('quiz.allQuizzes')}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-300 transition-colors p-1.5 rounded-md hover:bg-gray-700/50"
            >
              <ListChecks size={14} />
              {t('quiz.allQuizzes')}
            </button>
          )}
        </div>
      }
    />
  );
}
