import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type { UseLessonSearchReturn } from '../../hooks/useLessonSearch';

interface ViewerSearchProps {
  search: UseLessonSearchReturn;
}

export default function ViewerSearch({ search }: ViewerSearchProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        inputRef.current?.select();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) search.handleSearchPrev();
        else search.handleSearchNext();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        search.handleSearchClose();
        return;
      }
    },
    [search],
  );

  return (
    <div
      data-testid="viewer-search"
      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-750 border-b border-gray-700 text-xs shrink-0"
    >
      <span className="text-gray-400 text-sm">{t('icons.search')}</span>
      <input
        ref={inputRef}
        type="text"
        value={search.searchQuery}
        onChange={(e) => search.handleSearchQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('viewerSearch.placeholder')}
        className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none min-w-0"
      />
      {search.searchQuery && (
        <span className="text-gray-500 tabular-nums whitespace-nowrap">
          {search.totalMatches > 0
            ? t('viewerSearch.matchCount', {
                current: search.currentMatchIndex + 1,
                total: search.totalMatches,
              })
            : t('viewerSearch.noMatches')}
        </span>
      )}
      {search.searchQuery && search.totalMatches > 0 && (
        <>
          <button
            onClick={search.handleSearchPrev}
            className="text-gray-400 hover:text-white px-1 py-0.5 rounded transition-colors"
            title={t('viewerSearch.prev')}
          >
            ↑
          </button>
          <button
            onClick={search.handleSearchNext}
            className="text-gray-400 hover:text-white px-1 py-0.5 rounded transition-colors"
            title={t('viewerSearch.next')}
          >
            ↓
          </button>
        </>
      )}
      <button
        onClick={search.handleSearchClose}
        className="text-gray-500 hover:text-gray-300 px-1.5 py-0.5 rounded transition-colors"
        title={t('icons.close')}
      >
        {t('icons.close')}
      </button>
    </div>
  );
}
