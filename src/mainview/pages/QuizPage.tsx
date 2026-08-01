import { useTranslation } from 'react-i18next';

import type { Course, ModuleMeta } from '../../bun/types';
import QuizHeader from '../components/QuizHeader';
import PageContent from '../layouts/PageContent';
import PageLayout from '../layouts/PageLayout';
import QuizSection from '../sections/QuizSection';
import { useViewStore } from '../stores/viewStore';

interface QuizPageProps {
  course: Course;
  module: ModuleMeta;
  onBack: () => void;
}

export default function QuizPage({ course, module, onBack }: QuizPageProps) {
  const { t } = useTranslation();
  const push = useViewStore((s) => s.push);
  return (
    <PageLayout>
      <QuizHeader
        onBack={onBack}
        currentCourseId={course.id}
        title={`${module.name} — ${t('common.quiz')}`}
        onAllQuizzes={() => push({ type: 'quizHub', course })}
      />
      <PageContent className="px-6 quiz-bg">
        <QuizSection course={course} module={module} />
      </PageContent>
    </PageLayout>
  );
}
