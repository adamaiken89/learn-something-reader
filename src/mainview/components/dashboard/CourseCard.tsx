import type { Course } from '../../../bun/types';
import { countCompleted, useCompletionStore } from '../../stores/completionStore';
import { useViewStore } from '../../stores/viewStore';
import CourseTags from './CourseTags';
import ProgressBar from './ProgressBar';

export default function CourseCard({ course }: { course: Course }) {
  const push = useViewStore((s) => s.push);
  const completed = useCompletionStore((s) => s.completed);
  const totalModules = useCompletionStore((s) => s.totalModules);
  const total = totalModules[course.id] ?? course.modules.length;
  const done = countCompleted(completed, course.id);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <button
      onClick={() => push({ type: 'lesson', course, module: course.modules[0] })}
      className="text-left bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl p-5 transition-colors group cursor-pointer"
    >
      <h2 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">
        {course.displayName}
      </h2>
      <CourseTags
        targetLevel={course.targetLevel}
        timeHours={course.timeBudgetHours}
        moduleCount={course.modules.length}
      />
      {total > 0 && <ProgressBar pct={pct} />}
    </button>
  );
}
