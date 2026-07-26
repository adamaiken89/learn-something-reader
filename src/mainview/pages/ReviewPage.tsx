import QuizHeader from '../components/QuizHeader';
import PageContent from '../layouts/PageContent';
import PageLayout from '../layouts/PageLayout';
import ReviewSection from '../sections/ReviewSection';

interface ReviewPageProps {
  courseId: string;
  onBack: () => void;
}

export default function ReviewPage({ courseId, onBack }: ReviewPageProps) {
  return (
    <PageLayout>
      <QuizHeader onBack={onBack} currentCourseId={courseId} />
      <PageContent className="px-6 quiz-bg py-8">
        <ReviewSection courseId={courseId} />
      </PageContent>
    </PageLayout>
  );
}
