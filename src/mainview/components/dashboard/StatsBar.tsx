import { BookOpen, Clock, Flame, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { GlobalStats } from '../../../bun/stats';
import { useCountUp } from '../../hooks/useCountUp';

function StatItem({
  value,
  suffix,
  color,
  label,
  icon: Icon,
  large,
}: {
  value: number;
  suffix: string;
  color: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  large?: boolean;
}) {
  const animated = useCountUp(value);
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${color} opacity-60`}>
        <Icon size={large ? 20 : 14} />
      </div>
      <div>
        <p className={`font-semibold ${color} ${large ? 'text-2xl' : 'text-sm'}`}>
          {animated}
          {suffix}
        </p>
        <p className="text-[11px] text-gray-500 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

export default function StatsBar({
  stats,
  onSrsDueClick,
}: {
  stats: NonNullable<GlobalStats>;
  onSrsDueClick?: () => void;
}) {
  const { t } = useTranslation();
  const minutesSuffix = ` ${t('dashboard.minutes', { count: stats.totalStudyMinutes }).replace(/[0-9]/g, '')}`;

  return (
    <div className="mb-4">
      <div className="bg-[#131620] border border-white/[0.06] rounded-lg px-5 py-4">
        <div className="flex items-baseline justify-between gap-6">
          <StatItem
            value={stats.totalCompletedModules}
            suffix={`/${stats.totalModules}`}
            color="text-indigo-400"
            label={t('dashboard.modulesDone')}
            icon={BookOpen}
            large
          />
          <StatItem
            value={stats.totalStudyMinutes}
            suffix={minutesSuffix}
            color="text-indigo-400"
            label={t('dashboard.studyTime')}
            icon={Clock}
            large
          />
        </div>
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-6">
          <StatItem
            value={stats.streak}
            suffix="d"
            color="text-emerald-400"
            label={t('dashboard.streak')}
            icon={Flame}
          />
          <StatItem
            value={stats.totalCourses}
            suffix=""
            color="text-gray-400"
            label={t('dashboard.courses')}
            icon={Layers}
          />
        </div>
      </div>

      {stats.totalSrsDueCount > 0 && (
        <div className="mt-3 bg-amber-500/5 border border-amber-500/15 rounded-lg px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs text-amber-400/90">
            {t('dashboard.srsDue', { count: stats.totalSrsDueCount })}
          </span>
          {onSrsDueClick && (
            <button
              onClick={onSrsDueClick}
              className="text-[11px] font-medium text-amber-400 hover:text-amber-300 underline underline-offset-2"
            >
              {t('common.review', 'Review')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
