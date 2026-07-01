import { useTranslation } from 'react-i18next';

import type { FilterMode } from '../../hooks/useCardReviewState';
import { filterVariants } from '../ui';

interface FilterBarProps {
  filter: FilterMode;
  onFilter: (f: FilterMode) => void;
}

export default function FilterBar({ filter, onFilter }: FilterBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {(['all', 'due', 'starred'] as const).map((f) => (
        <button
          key={f}
          onClick={() => onFilter(f)}
          className={filterVariants({ active: filter === f })}
        >
          {f === 'all' ? t('review.all') : f === 'due' ? t('review.due') : t('review.starred')}
        </button>
      ))}
    </div>
  );
}
