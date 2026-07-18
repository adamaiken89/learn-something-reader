import type { Course, ModuleMeta } from '../../bun/types';
import CourseSwitcher from '../components/CourseSwitcher';
import PageContent from '../layouts/PageContent';
import PageHeader from '../layouts/PageHeader';
import PageLayout from '../layouts/PageLayout';
import QuizSection from '../sections/QuizSection';
import { useViewStore } from '../stores/viewStore';

interface QuizPageProps {
  course: Course;
  module: ModuleMeta;
  onBack: () => void;
}

export default function QuizPage({ course, module, onBack }: QuizPageProps) {
  const replace = useViewStore((s) => s.replace);
  return (
    <PageLayout>
      <PageHeader
        onBack={onBack}
        center={
          <CourseSwitcher
            currentCourseId={course.id}
            onSelect={(c) => replace({ type: 'lesson', course: c, module: c.modules[0] })}
          />
        }
      />
      <PageContent className="px-6 quiz-bg">
        <QuizSection course={course} module={module} />
      </PageContent>
    </PageLayout>
  );
}
