import { useTranslation } from 'react-i18next';

import type { Course, ModuleMeta } from '../../bun/types';
import QuizHeader from '../components/QuizHeader';
import PageContent from '../layouts/PageContent';
import PageLayout from '../layouts/PageLayout';
import ClozeQuizSection from '../sections/ClozeQuizSection';

interface Props {
  course: Course;
  module: ModuleMeta;
  onBack: () => void;
}

export default function ClozeQuizPage({ course, module, onBack }: Props) {
  const { t } = useTranslation();
  return (
    <PageLayout>
      <QuizHeader
        onBack={onBack}
        currentCourseId={course.id}
        title={`${module.name} — ${t('lesson.clozeQuiz')}`}
      />
      <PageContent className="px-6 quiz-bg">
        <ClozeQuizSection course={course} module={module} />
      </PageContent>
    </PageLayout>
  );
}
