import { useTranslation } from 'react-i18next';

import type { GlobalStats } from '../../../bun/stats';
import { useCountUp } from '../../hooks/useCountUp';

function StatItem({
  value,
  suffix,
  color,
  label,
}: {
  value: number;
  suffix: string;
  color: string;
  label: string;
}) {
  const animated = useCountUp(value);
  return (
    <div className="flex flex-col items-center gap-0.5">
      <p className={`text-xl font-semibold ${color}`}>
        {animated}
        {suffix}
      </p>
      <p className="text-[11px] text-gray-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}

export default function StatsBar({ stats }: { stats: NonNullable<GlobalStats> }) {
  const { t } = useTranslation();
  return (
    <div className="bg-gray-800/30 rounded-lg px-4 py-3 mb-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 items-baseline justify-between gap-3">
        <StatItem
          value={stats.totalCompletedModules}
          suffix={`/${stats.totalModules}`}
          color="text-indigo-400"
          label={t('dashboard.modulesDone')}
        />
        <StatItem
          value={stats.streak}
          suffix="d"
          color="text-emerald-400"
          label={t('dashboard.streak')}
        />
        <StatItem
          value={stats.totalStudyMinutes}
          suffix=" min"
          color="text-amber-400"
          label={t('dashboard.studyTime')}
        />
        <StatItem
          value={stats.totalCourses}
          suffix=""
          color="text-indigo-400"
          label={t('dashboard.courses')}
        />
      </div>
      {stats.totalSrsDueCount > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-700/50 flex items-center justify-center">
          <span className="text-[10px] text-amber-400">
            {t('dashboard.srsDue', { count: stats.totalSrsDueCount })}
          </span>
        </div>
      )}
    </div>
  );
}
