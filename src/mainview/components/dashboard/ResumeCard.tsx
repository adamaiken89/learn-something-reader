import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { LastSession } from '../../../bun/types';
import { useCompletionStore } from '../../stores/completionStore';
import { useViewStore } from '../../stores/viewStore';
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
    <div className="w-full h-full text-left bg-[#131620] hover:bg-[#151a28] border border-indigo-500/20 hover:border-indigo-500/35 rounded-lg px-5 py-3 transition-all duration-200 ring-1 ring-indigo-500/5 hover:ring-indigo-500/10 shadow-lg shadow-indigo-500/5 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-indigo-400 mb-0.5 uppercase tracking-wider">
          {t('dashboard.resume')}
        </p>
        <h2 className="text-base font-semibold text-white truncate">
          {lastSession.course.displayName}
        </h2>
        <p className="text-xs text-gray-400 truncate">
          {t('dashboard.moduleProgress', { module: lastSession.module.name })}
          {nextModule && ` · ${t('dashboard.nextModule', { module: nextModule.name })}`}
          {!nextModule && ` · ${t('dashboard.courseCompleteShort')}`}
        </p>
      </div>

      {total > 0 && (
        <div className="hidden sm:block w-32 shrink-0">
          <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
            <span>
              {done}/{total}
            </span>
            <span>({pct}%)</span>
          </div>
          <ProgressBar pct={pct} />
        </div>
      )}

      <button
        onClick={handleContinue}
        className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-lg shadow-indigo-500/15 transition-all duration-200 flex items-center gap-1.5 shrink-0"
      >
        {t('dashboard.continueLearning')} <ArrowRight size={14} />
      </button>
    </div>
  );
}
