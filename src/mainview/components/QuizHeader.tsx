import PageHeader from '../layouts/PageHeader';
import { useViewStore } from '../stores/viewStore';
import CourseSwitcher from './CourseSwitcher';

interface QuizHeaderProps {
  onBack: () => void;
  currentCourseId: string;
  title?: string;
}

export default function QuizHeader({ onBack, currentCourseId, title }: QuizHeaderProps) {
  const replace = useViewStore((s) => s.replace);
  return (
    <PageHeader
      onBack={onBack}
      title={title}
      center={
        <CourseSwitcher
          currentCourseId={currentCourseId}
          onSelect={(c) => replace({ type: 'lesson', course: c, module: c.modules[0] })}
        />
      }
    />
  );
}
