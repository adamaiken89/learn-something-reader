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
}: {
  value: number;
  suffix: string;
  color: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  const animated = useCountUp(value);
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${color} opacity-60`}>
        <Icon size={16} />
      </div>
      <div>
        <p className={`font-semibold ${color} text-lg`}>
          {animated}
          {suffix}
        </p>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

export default function StatsBar({ stats }: { stats: NonNullable<GlobalStats> }) {
  const { t } = useTranslation();
  const minutesSuffix = ` ${t('dashboard.minutes', { count: stats.totalStudyMinutes }).replace(/[0-9]/g, '')}`;

  return (
    <div className="h-full bg-[#131620] border border-white/[0.06] rounded-lg px-5 py-3 flex items-center justify-between gap-4">
      <StatItem
        value={stats.totalCompletedModules}
        suffix={`/${stats.totalModules}`}
        color="text-indigo-400"
        label={t('dashboard.modulesDone')}
        icon={BookOpen}
      />
      <StatItem
        value={stats.totalStudyMinutes}
        suffix={minutesSuffix}
        color="text-indigo-400"
        label={t('dashboard.studyTime')}
        icon={Clock}
      />
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
  );
}
