import { CheckCircle2, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { Course } from '../../../bun/types';
import { countCompleted, useCompletionStore } from '../../stores/completionStore';
import { useViewStore } from '../../stores/viewStore';
import ProgressBar from './ProgressBar';

function formatTargetLevel(level: string): string {
  return level
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

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
      data-testid="course-card"
      className="text-left bg-[#131620] border border-white/[0.06] hover:border-indigo-500/25 rounded-lg p-4 transition-all duration-200 group cursor-pointer flex flex-col h-full justify-between"
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-white group-hover:text-indigo-400 transition-colors line-clamp-1 truncate">
          {course.displayName}
        </h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md text-[11px] font-medium">
            {formatTargetLevel(course.targetLevel)}
          </span>
          <span className="text-[11px] text-gray-500">
            {course.timeBudgetHours}h · {t('dashboard.modules', { count: course.modules.length })}
          </span>
        </div>
      </div>

      <div className="pt-3">
        {total > 0 && <ProgressBar pct={pct} size="sm" />}
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className={`flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${btnColor}`}
          >
            {isComplete ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            {isComplete
              ? t('dashboard.complete', 'Complete')
              : done > 0
                ? t('dashboard.continue', 'Continue')
                : t('dashboard.start', 'Start')}
          </button>
          {done > 0 && !isComplete && (
            <span className="text-[11px] text-gray-500">
              {done}/{total}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
