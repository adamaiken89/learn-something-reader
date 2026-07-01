import CourseSwitcher from '../components/CourseSwitcher';
import PageContent from '../layouts/PageContent';
import PageHeader from '../layouts/PageHeader';
import PageLayout from '../layouts/PageLayout';
import QuizSection from '../sections/QuizSection';
import { useViewStore } from '../stores/viewStore';

interface QuizPageProps {
  courseId: string;
  moduleId: string;
  onBack: () => void;
}

export default function QuizPage({ courseId, moduleId, onBack }: QuizPageProps) {
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
        <QuizSection courseId={courseId} moduleId={moduleId} />
      </PageContent>
    </PageLayout>
  );
}
