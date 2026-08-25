import { ChevronDown, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { selectableItemVariants } from '@/lib/card-styles';

import type { Course } from '../../bun/types';
import { useDelayedUnmount } from '../hooks/useDelayedUnmount';
import { countCompleted, useCompletionStore } from '../stores/completionStore';
import { useCourseStore } from '../stores/courseStore';

interface Props {
  currentCourseId?: string;
  onSelect: (course: Course) => void;
}

export default function CourseSwitcher({ currentCourseId, onSelect }: Props) {
  const { t } = useTranslation();
  const courses = useCourseStore((s) => s.courses);
  const completed = useCompletionStore((s) => s.completed);
  const load = useCourseStore((s) => s.load);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = courses.find((s) => s.id === currentCourseId);
  const showDropdown = useDelayedUnmount(open, 150);

  const filtered = courses.filter(
    (s) => !search || s.displayName.toLowerCase().includes(search.toLowerCase()),
  );

  const inProgress = filtered.filter((s) => {
    const count = countCompleted(completed, s.id);
    return count > 0 && count < s.modules.length;
  });
  const notStarted = filtered.filter((s) => {
    const count = countCompleted(completed, s.id);
    return count === 0;
  });
  const done = filtered.filter((s) => {
    const count = countCompleted(completed, s.id);
    return count > 0 && count >= s.modules.length;
  });

  const renderItem = (s: Course) => {
    const count = countCompleted(completed, s.id);
    const total = s.modules.length;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    const isCurrent = s.id === currentCourseId;

    return (
      <button
        key={s.id}
        onClick={() => {
          onSelect(s);
          setOpen(false);
          setSearch('');
        }}
        className={`w-full text-left px-3 py-2.5 text-sm ${selectableItemVariants({ selected: isCurrent })}`}
      >
        <div className="font-medium truncate">{s.displayName}</div>
        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
          <span>
            {s.modules.length} {t('common.modules')} · {s.timeBudgetHours}h
          </span>
          {total > 0 && (
            <span className="text-indigo-400/90">
              {count}/{total} ({pct}%)
            </span>
          )}
        </div>
        {total > 0 && (
          <div className="mt-1.5 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
          </div>
        )}
      </button>
    );
  };

  return (
    <div ref={ref} className="relative shrink-0" data-course-id={currentCourseId}>
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center gap-2 min-w-[240px]"
      >
        <span className="truncate">{current?.displayName ?? t('common.modules')}</span>
        <span className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`}>
          <ChevronDown size={14} />
        </span>
      </button>
      {showDropdown && (
        <div
          className={`absolute top-full right-0 mt-1 w-[420px] bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-sm ${open ? 'anim-dropdown-in' : 'anim-dropdown-out'}`}
        >
          {courses.length > 0 && (
            <div className="p-2 border-b border-white/[0.06]">
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('courseSwitcher.search', 'Search courses...')}
                  className="w-full bg-gray-700/60 text-gray-200 text-xs rounded-lg pl-7 pr-3 py-1.5 border border-gray-600/50 outline-none focus:border-indigo-500/50 transition-colors placeholder-gray-500"
                />
              </div>
            </div>
          )}

          <div className="max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
            {courses.length === 0 && (
              <div className="p-3 text-sm text-gray-500">{t('courseSwitcher.noCourses')}</div>
            )}

            {search && filtered.length === 0 && (
              <div className="p-3 text-sm text-gray-500">
                {t('courseSwitcher.noResults', 'No courses match')}
              </div>
            )}

            {!search && inProgress.length > 0 && (
              <div>
                <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  {t('courseSwitcher.inProgress', 'In Progress')}
                </p>
                {inProgress.map(renderItem)}
              </div>
            )}

            {notStarted.length > 0 && (
              <div>
                {!search && inProgress.length > 0 && <div className="mx-3 h-px bg-white/[0.04]" />}
                {!search && (
                  <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    {t('courseSwitcher.notStarted', 'Not Started')}
                  </p>
                )}
                {notStarted.map(renderItem)}
              </div>
            )}

            {done.length > 0 && (
              <div>
                {!search && (
                  <>
                    <div className="mx-3 h-px bg-white/[0.04]" />
                    <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      {t('courseSwitcher.completed', 'Completed')}
                    </p>
                  </>
                )}
                {done.map(renderItem)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
