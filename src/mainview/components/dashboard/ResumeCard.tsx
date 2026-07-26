import { ArrowRight, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { LastSession } from '../../../bun/types';
import { useCompletionStore } from '../../stores/completionStore';
import { useViewStore } from '../../stores/viewStore';
import CourseTags from './CourseTags';
import ProgressBar from './ProgressBar';

export default function ResumeCard({ lastSession }: { lastSession: LastSession }) {
  const { t } = useTranslation();
  const push = useViewStore((s) => s.push);
  const completed = useCompletionStore((s) => s.completed);
  const total = useCompletionStore((s) => s.totalModules[lastSession.course.id] ?? 0);
  const done = Object.keys(completed).filter((k) =>
    k.startsWith(`${lastSession.course.id}:`),
  ).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const modules = lastSession.course.modules;
  const currentIdx = modules.findIndex((m) => m.id === lastSession.module.id);
  const nextModule =
    currentIdx >= 0 && currentIdx < modules.length - 1 ? modules[currentIdx + 1] : null;

  const handleContinue = () =>
    push({
      type: 'lesson',
      course: lastSession.course,
      module: lastSession.module,
      sectionID: lastSession.sectionId,
    });

  return (
    <div className="w-full text-left bg-[#131620] hover:bg-[#151a28] border border-indigo-500/20 hover:border-indigo-500/35 rounded-lg p-5 mb-4 transition-all duration-200 ring-1 ring-indigo-500/5 hover:ring-indigo-500/10 shadow-lg shadow-indigo-500/5">
      <div className="flex flex-col md:flex-row md:gap-6">
        <div className="md:w-1/2 lg:w-1/3">
          <p className="text-xs font-semibold text-indigo-400 mb-1">{t('dashboard.resume')}</p>
          <h2 className="text-lg font-semibold text-white">{lastSession.course.displayName}</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {t('dashboard.moduleProgress', { module: lastSession.module.name })}
          </p>
          <CourseTags
            targetLevel={lastSession.course.targetLevel}
            timeHours={lastSession.course.timeBudgetHours}
            moduleCount={modules.length}
          />
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>{t('dashboard.progress')}</span>
              <span>
                {done}/{total} ({pct}%)
              </span>
            </div>
            <ProgressBar pct={pct} />
          </div>
        </div>

        <div className="hidden md:block w-px bg-white/[0.06] self-stretch mx-2" />

        <div className="mt-4 md:mt-0 md:flex-1 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">
              <Target size={12} className="inline mr-1" />
              {t('dashboard.nextUp')}
            </p>
            {nextModule ? (
              <p className="text-xs text-gray-300 leading-relaxed">
                {t('dashboard.nextModule', { module: nextModule.name })}
              </p>
            ) : (
              <p className="text-xs text-gray-500">{t('dashboard.courseComplete')}</p>
            )}
          </div>

          <div className="mt-3 flex items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleContinue();
              }}
              className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm px-6 py-2.5 rounded-lg shadow-lg shadow-indigo-500/15 transition-all duration-200 flex items-center gap-2"
            >
              {t('dashboard.continueLearning')} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
