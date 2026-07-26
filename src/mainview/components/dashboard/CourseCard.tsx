import { CheckCircle2, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { Course } from '../../../bun/types';
import { countCompleted, useCompletionStore } from '../../stores/completionStore';
import { useViewStore } from '../../stores/viewStore';
import CourseTags from './CourseTags';
import ProgressBar from './ProgressBar';

export default function CourseCard({ course }: { course: Course }) {
  const { t } = useTranslation();
  const push = useViewStore((s) => s.push);
  const completed = useCompletionStore((s) => s.completed);
  const totalModules = useCompletionStore((s) => s.totalModules);
  const total = totalModules[course.id] ?? course.modules.length;
  const done = countCompleted(completed, course.id);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isComplete = total > 0 && done === total;

  const handleClick = () => {
    push({ type: 'syllabus', course });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const btnColor = isComplete
    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25'
    : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/25';

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className="text-left bg-[#131620] border border-white/[0.06] hover:border-indigo-500/25 rounded-lg p-5 transition-all duration-200 group cursor-pointer flex flex-col h-full justify-between"
    >
      <div>
        <h2 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors line-clamp-2">
          {course.displayName}
        </h2>
        <CourseTags
          targetLevel={course.targetLevel}
          timeHours={course.timeBudgetHours}
          moduleCount={course.modules.length}
        />
        {total > 0 && <ProgressBar pct={pct} />}
      </div>

      <div className="flex items-center gap-2 pt-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className={`flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all min-w-[92px] ${btnColor}`}
        >
          {isComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isComplete
            ? t('dashboard.complete', 'Complete')
            : done > 0
              ? t('dashboard.continue', 'Continue')
              : t('dashboard.start', 'Start')}
        </button>

        {done > 0 && !isComplete && (
          <span className="text-[11px] text-gray-500">
            {done}/{total} {t('dashboard.modulesDone')}
          </span>
        )}
      </div>
    </div>
  );
}
