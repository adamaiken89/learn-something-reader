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
            onSelect={(course) => replace({ type: 'moduleList', course })}
          />
        }
      />
      <PageContent>
        <ReviewSection courseId={courseId} />
      </PageContent>
    </PageLayout>
  );
}
