import { useTranslation } from 'react-i18next';

import type { GlobalStats } from '../../../bun/stats';
import { COMPLETION_GREEN } from '../../colors';
import { StatCard } from '../../components/ui/StatCard';

interface GlobalStatsViewProps {
  stats: GlobalStats;
}

export default function GlobalStatsView({ stats }: GlobalStatsViewProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          label={t('dashboard.modulesDone')}
          value={`${stats.totalCompletedModules}/${stats.totalModules}`}
        />
        <StatCard
          label={t('dashboard.streak')}
          value={stats.streak}
          suffix="days"
          color={COMPLETION_GREEN}
        />
        <StatCard
          label={t('dashboard.studyTime')}
          value={t('dashboard.minutes', { count: stats.totalStudyMinutes })}
        />
        <StatCard label={t('dashboard.courses')} value={stats.totalCourses} />
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 mb-2">{t('dashboard.courseProgress')}</p>
        <div className="space-y-2">
          {stats.courseSummaries.map((cs) => {
            const pct = cs.total > 0 ? Math.round((cs.completed / cs.total) * 100) : 0;
            return (
              <div key={cs.courseID}>
                <div className="flex items-center justify-between text-xs mb-0.5">
                  <span className="text-gray-300 truncate">{cs.courseName}</span>
                  <span className="text-gray-500 tabular-nums">
                    {cs.completed}/{cs.total}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
