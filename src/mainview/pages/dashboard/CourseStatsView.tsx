import { useTranslation } from 'react-i18next';

import type { CourseStats } from '../../../bun/stats';
import { ACCENT_INDIGO_LIGHT, COMPLETION_GREEN, WARNING_AMBER } from '../../colors';
import { StatCard } from '../../components/ui/StatCard';

interface CourseStatsViewProps {
  stats: CourseStats;
}

export default function CourseStatsView({ stats }: CourseStatsViewProps) {
  const { t } = useTranslation();
  const completionPct =
    stats.totalModules > 0 ? Math.round((stats.completedModules / stats.totalModules) * 100) : 0;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          label={t('dashboard.modulesDone')}
          value={`${stats.completedModules}/${stats.totalModules}`}
          suffix={`(${completionPct}%)`}
          color={completionPct === 100 ? COMPLETION_GREEN : ACCENT_INDIGO_LIGHT}
        />
        <StatCard
          label={t('dashboard.avgQuizScore')}
          value={stats.avgQuizScore}
          suffix="%"
          color={stats.avgQuizScore >= 80 ? COMPLETION_GREEN : WARNING_AMBER}
        />
        <StatCard
          label={t('dashboard.srsDue')}
          value={stats.srsDueCount}
          suffix={`/ ${stats.srsTotalCards}`}
          color={WARNING_AMBER}
        />
        <StatCard
          label={t('dashboard.streak')}
          value={stats.streak}
          suffix="days"
          color={COMPLETION_GREEN}
        />
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold text-gray-400 mb-2">{t('dashboard.studyTime')}</p>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400"
            style={{
              width: `${Math.min(100, (stats.totalStudyMinutes / (stats.totalModules * 60)) * 100)}%`,
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {t('dashboard.minutes', { count: stats.totalStudyMinutes })}
        </p>
      </div>

      {stats.recentSessions.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-400 mb-2">
            {t('dashboard.recentActivity')}
          </p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {stats.recentSessions.slice(0, 10).map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] text-gray-500">
                <span className="shrink-0 w-6 text-gray-600">{s.date.slice(5)}</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    s.type === 'reading'
                      ? 'bg-indigo-500'
                      : s.type === 'quiz'
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                  }`}
                />
                <span className="capitalize">{s.type}</span>
                <span className="ml-auto">{s.durationMinutes}m</span>
                {s.score != null && (
                  <span className="text-gray-600">
                    {s.score}/{s.total}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
