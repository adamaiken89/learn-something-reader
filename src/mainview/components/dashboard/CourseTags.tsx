import { useTranslation } from 'react-i18next';

function formatTargetLevel(level: string): string {
  return level
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function CourseTags({
  targetLevel,
  timeHours,
  moduleCount,
}: {
  targetLevel: string;
  timeHours: number;
  moduleCount: number;
}) {
  const { t } = useTranslation();
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      <span className="bg-indigo-900/40 border border-indigo-700/40 text-indigo-300 px-2 py-0.5 rounded-md text-[11px] font-medium">
        {formatTargetLevel(targetLevel)}
      </span>
      <span className="bg-emerald-900/40 border border-emerald-700/40 text-emerald-300 px-2 py-0.5 rounded-md text-[11px] font-medium">
        {timeHours}h
      </span>
      <span className="bg-amber-900/40 border border-amber-700/40 text-amber-300 px-2 py-0.5 rounded-md text-[11px] font-medium">
        {t('dashboard.modules', { count: moduleCount })}
      </span>
    </div>
  );
}
