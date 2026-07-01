import { useTranslation } from 'react-i18next';

import { useSearchOverlay } from '../hooks/useSearchOverlay';
import { useCourseStore } from '../stores/courseStore';
import CourseFilterChips from './CourseFilterChips';
import SearchResultItem from './SearchResultItem';

interface SearchOverlayProps {
  initialCourseIDs?: string[];
  onClose: () => void;
}

export default function SearchOverlay({ initialCourseIDs, onClose }: SearchOverlayProps) {
  const { t } = useTranslation();
  const courses = useCourseStore((s) => s.courses);

  const {
    query,
    setQuery,
    results,
    loading,
    courseFilters,
    selectedIdx,
    inputRef,
    resultsRef,
    closing,
    handleClose,
    handleKeyDown,
    handleSelectionChange,
    navigate,
    groupedResults,
  } = useSearchOverlay({ initialCourseIDs, onClose });

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-start justify-center pt-20 ${closing ? 'anim-overlay-out' : 'anim-overlay-in'}`}
    >
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div
        className={`relative bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 ${closing ? 'anim-pop-out' : 'anim-pop-in'}`}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700">
          <span className="text-gray-400 text-sm">{t('icons.search')}</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              courseFilters.length > 0
                ? t('search.placeholderFiltered', {
                    count: courseFilters.length,
                  })
                : t('search.placeholder')
            }
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none"
          />
          {loading && <span className="text-xs text-gray-500">...</span>}
          <button
            onClick={handleClose}
            className="text-xs text-gray-500 hover:text-gray-300 px-1.5"
          >
            ESC
          </button>
        </div>

        <CourseFilterChips
          allCourses={courses}
          selectedIDs={courseFilters}
          onSelectionChange={handleSelectionChange}
          onEscape={() => inputRef.current?.focus()}
        />

        <div className="max-h-96 overflow-y-auto" ref={resultsRef}>
          {results.length > 0 && (
            <div className="px-2 py-1 text-[10px] text-gray-500 border-b border-gray-700">
              {t('search.results', { count: results.length })}
            </div>
          )}
          {results.length === 0 && query.trim() && !loading && (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              {t('search.noResults')}
            </div>
          )}
          {Array.from(groupedResults.entries()).map(([courseID, group]) => (
            <div key={courseID}>
              <div className="px-3 py-1.5 text-[11px] font-medium text-gray-400 bg-gray-800 border-b border-gray-700/50 sticky top-0 z-[1]">
                {group.courseName}
              </div>
              {group.items.map(({ r, idx }) => (
                <SearchResultItem
                  key={`${r.type}:${r.courseID}:${r.moduleID}:${idx}`}
                  result={r}
                  query={query}
                  isActive={selectedIdx === idx}
                  onNavigate={() => {
                    navigate(r.courseID, r.moduleID, r.sectionID);
                    handleClose();
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
