import { useTranslation } from 'react-i18next';

import CourseTags from './CourseTags';
import ProgressBar from './ProgressBar';
import { useCompletionStore } from '../../stores/completionStore';
import { useViewStore } from '../../stores/viewStore';

import type { LastSession } from '../../../bun/types';

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
    <button
      onClick={handleContinue}
      className="w-full text-left bg-gray-800 hover:bg-gray-750 border border-indigo-700 rounded-xl p-5 mb-6 transition-colors group cursor-pointer"
    >
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
            <ProgressBar pct={pct} size="sm" />
          </div>
        </div>

        <div className="hidden md:block w-px bg-gray-700/40 self-stretch mx-2" />

        <div className="mt-4 md:mt-0 md:flex-1 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">🎯 {t('dashboard.nextUp')}</p>
            {nextModule ? (
              <p className="text-xs text-gray-300 leading-relaxed">
                {t('dashboard.nextModule', { module: nextModule.name })}
              </p>
            ) : (
              <p className="text-xs text-gray-500">{t('dashboard.courseComplete')}</p>
            )}
          </div>
          <div className="mt-3 md:mt-auto">
            <span className="inline-block bg-white text-gray-900 hover:bg-gray-100 font-medium text-xs px-4 py-2 rounded-lg shadow-sm transition-all duration-200">
              {t('dashboard.continueLearning')} ➔
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
