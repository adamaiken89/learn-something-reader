import CourseSwitcher from '../components/CourseSwitcher';
import PageContent from '../layouts/PageContent';
import PageHeader from '../layouts/PageHeader';
import PageLayout from '../layouts/PageLayout';
import ReviewSection from '../sections/ReviewSection';
import { useViewStore } from '../stores/viewStore';

interface ReviewPageProps {
  courseId: string;
  onBack: () => void;
}

export default function ReviewPage({ courseId, onBack }: ReviewPageProps) {
  const replace = useViewStore((s) => s.replace);
  return (
    <PageLayout>
      <PageHeader
        onBack={onBack}
        center={
          <CourseSwitcher
            currentCourseId={courseId}
            onSelect={(course) => replace({ type: 'lesson', course, module: course.modules[0] })}
          />
        }
      />
      <PageContent>
        <ReviewSection courseId={courseId} />
      </PageContent>
    </PageLayout>
  );
}
