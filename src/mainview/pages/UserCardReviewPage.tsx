import CourseSwitcher from '../components/CourseSwitcher';
import PageContent from '../layouts/PageContent';
import PageHeader from '../layouts/PageHeader';
import PageLayout from '../layouts/PageLayout';
import UserCardReviewSection from '../sections/UserCardReviewSection';
import { useViewStore } from '../stores/viewStore';

interface UserCardReviewPageProps {
  courseId: string;
  onBack: () => void;
}

export default function UserCardReviewPage({ courseId, onBack }: UserCardReviewPageProps) {
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
        <UserCardReviewSection courseId={courseId} />
      </PageContent>
    </PageLayout>
  );
}
