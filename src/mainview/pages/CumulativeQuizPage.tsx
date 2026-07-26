import { useTranslation } from 'react-i18next';

import type { Course } from '../../bun/types';
import QuizHeader from '../components/QuizHeader';
import PageContent from '../layouts/PageContent';
import PageLayout from '../layouts/PageLayout';
import CumulativeQuizSection from '../sections/CumulativeQuizSection';

interface Props {
  course: Course;
  cumulativeQuizId?: string;
  onBack: () => void;
}

function displayLabel(id?: string): string {
  if (!id) return '';
  const range = id.match(/^cumulative_quiz_(\d+)-(\d+).yaml$/);
  if (range) return ` (${range[1].padStart(2, '0')}–${range[2].padStart(2, '0')})`;
  const single = id.match(/^cumulative_quiz_(\d+).yaml$/);
  if (single) return ` (01–${single[1].padStart(2, '0')})`;
  return '';
}

export default function CumulativeQuizPage({ course, cumulativeQuizId, onBack }: Props) {
  const { t } = useTranslation();
  return (
    <PageLayout>
      <QuizHeader
        onBack={onBack}
        currentCourseId={course.id}
        title={`${course.displayName} — ${t('lesson.cumulativeQuiz')}${displayLabel(cumulativeQuizId)}`}
      />
      <PageContent className="px-6 quiz-bg">
        <CumulativeQuizSection course={course} cumulativeQuizId={cumulativeQuizId} />
      </PageContent>
    </PageLayout>
  );
}
