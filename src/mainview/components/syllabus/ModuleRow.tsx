import { CheckCircle2, Clock, ListChecks } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { QuizAttemptStatus } from '../../../bun/stats';
import type { Course, ModuleMeta } from '../../../bun/types';

interface ModuleRowProps {
  mod: ModuleMeta;
  index: number;
  courseModules: Course['modules'];
  isCompleted: boolean;
  hasQuiz: boolean;
  attempt: QuizAttemptStatus | null;
  srsDueCount: number;
  onOpen: (mod: ModuleMeta) => void;
  onOpenQuiz: (mod: ModuleMeta) => void;
}

export default function ModuleRow({
  mod,
  index,
  courseModules,
  isCompleted,
  hasQuiz,
  attempt,
  srsDueCount,
  onOpen,
  onOpenQuiz,
}: ModuleRowProps) {
  const { t } = useTranslation();
  const quizDue = attempt?.due ?? false;
  const quizOverdue = attempt?.overdue ?? false;
  const showDue = quizDue || srsDueCount > 0;
  return (
    <div
      onClick={() => onOpen(mod)}
      data-testid="module-row"
      className="group flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-700/50 hover:border-indigo-500/30 bg-gray-800/30 hover:bg-gray-800/60 transition-all duration-150 cursor-pointer"
    >
      <span
        className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
          isCompleted
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-gray-700/50 text-gray-400 border border-gray-600/50'
        }`}
      >
        {isCompleted ? <CheckCircle2 size={14} /> : <span>{index + 1}</span>}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-medium text-gray-200 group-hover:text-indigo-400 transition-colors truncate"
            data-testid="module-name"
          >
            {mod.name}
          </span>
          {mod.timeHours > 0 && (
            <span className="shrink-0 text-[11px] text-gray-400 flex items-center gap-0.5">
              <Clock size={11} />
              {mod.timeHours}h
            </span>
          )}
        </div>
        {mod.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {mod.topics.slice(0, 5).map((topic) => (
              <span
                key={topic}
                className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/40 text-gray-400"
              >
                {topic}
              </span>
            ))}
            {mod.topics.length > 5 && (
              <span className="text-[10px] text-gray-600">+{mod.topics.length - 5}</span>
            )}
          </div>
        )}
        {mod.prerequisites.length > 0 && (
          <div className="mt-0.5 text-[10px] text-gray-600">
            {t('syllabus.prereqOf', 'Prereq:')}{' '}
            {mod.prerequisites
              .map((p) => courseModules.find((m) => m.id === p)?.name || p)
              .join(', ')}
          </div>
        )}
      </div>
      {showDue && (
        <span className="flex items-center gap-1.5 shrink-0">
          {quizDue && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                quizOverdue
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
              }`}
            >
              {quizOverdue ? t('syllabus.quizOverdue') : t('syllabus.quizReady')}
            </span>
          )}
          {srsDueCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {t('syllabus.srsDue', { count: srsDueCount })}
            </span>
          )}
        </span>
      )}
      {hasQuiz && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenQuiz(mod);
          }}
          title={t('quiz.allQuizzes')}
          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 border border-indigo-500/20 hover:border-indigo-500/40 transition-colors"
        >
          <ListChecks size={13} />
          {t('lesson.quizMCQ', 'MCQ')}
        </button>
      )}
    </div>
  );
}
