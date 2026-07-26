import { useTranslation } from 'react-i18next';

import type { Course, ModuleMeta } from '../../bun/types';
import QuizHeader from '../components/QuizHeader';
import PageContent from '../layouts/PageContent';
import PageLayout from '../layouts/PageLayout';
import QuizSection from '../sections/QuizSection';

interface QuizPageProps {
  course: Course;
  module: ModuleMeta;
  onBack: () => void;
}

export default function QuizPage({ course, module, onBack }: QuizPageProps) {
  const { t } = useTranslation();
  return (
    <PageLayout>
      <QuizHeader
        onBack={onBack}
        currentCourseId={course.id}
        title={`${module.name} — ${t('common.quiz')}`}
      />
      <PageContent className="px-6 quiz-bg">
        <QuizSection course={course} module={module} />
      </PageContent>
    </PageLayout>
  );
}
