import { useTranslation } from 'react-i18next';

import type { GlobalStats } from '../../../bun/stats';

export default function StatsBar({ stats }: { stats: NonNullable<GlobalStats> }) {
  const { t } = useTranslation();
  return (
    <div className="bg-gray-800/50 border border-gray-700/60 rounded-xl p-3 mt-4 mb-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/80 border border-gray-700/40 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-indigo-400">
            {stats.totalCompletedModules}/{stats.totalModules}
          </p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">
            {t('dashboard.modulesDone')}
          </p>
        </div>
        <div className="bg-gray-800/80 border border-gray-700/40 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-emerald-400">{stats.streak}d</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">
            {t('dashboard.streak')}
          </p>
        </div>
        <div className="bg-gray-800/80 border border-gray-700/40 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-amber-400">
            {t('dashboard.minutes', { count: stats.totalStudyMinutes })}
          </p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">
            {t('dashboard.studyTime')}
          </p>
        </div>
        <div className="bg-gray-800/80 border border-gray-700/40 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-indigo-400">{stats.totalCourses}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">
            {t('dashboard.courses')}
          </p>
        </div>
      </div>
    </div>
  );
}
