import { BookOpen, Heading2, Highlighter } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { loadingIndicator } from '@/lib/loading';

import type { Bookmark, BookmarkKind, Course } from '../../bun/types';
import PageContent from '../layouts/PageContent';
import PageHeader from '../layouts/PageHeader';
import PageLayout from '../layouts/PageLayout';
import { useBookmarksStore } from '../stores/bookmarksStore';
import { useCourseStore } from '../stores/courseStore';

type Tab = 'all' | BookmarkKind;

const TAB_KINDS: Record<Exclude<Tab, 'all'>, BookmarkKind> = {
  module: 'module',
  section: 'section',
  highlight: 'highlight',
};

const KIND_ICON: Record<BookmarkKind, typeof BookOpen> = {
  module: BookOpen,
  section: Heading2,
  highlight: Highlighter,
};

interface Props {
  onBack: () => void;
  onOpen: (courseID: string, moduleID: string, sectionID: string | null, courses: Course[]) => void;
}

function kindOf(b: Bookmark): BookmarkKind {
  return b.kind ?? (b.sectionID ? 'section' : 'module');
}

export default function BookmarksPage({ onBack, onOpen }: Props) {
  const { t } = useTranslation();
  const all = useBookmarksStore((s) => s.all);
  const allLoading = useBookmarksStore((s) => s.allLoading);
  const loadAll = useBookmarksStore((s) => s.loadAll);
  const remove = useBookmarksStore((s) => s.remove);
  const courses = useCourseStore((s) => s.courses);
  const loadCourses = useCourseStore((s) => s.load);

  const [tab, setTab] = useState<Tab>('all');
  const [courseFilter, setCourseFilter] = useState<string | null>(null);

  useEffect(() => {
    void loadCourses();
    void loadAll();
  }, [loadCourses, loadAll]);

  const kindFiltered = useMemo(
    () => (tab === 'all' ? all : all.filter((b) => kindOf(b) === TAB_KINDS[tab])),
    [all, tab],
  );

  const filtered = useMemo(
    () => (courseFilter ? kindFiltered.filter((b) => b.courseID === courseFilter) : kindFiltered),
    [kindFiltered, courseFilter],
  );

  const byCourse = useMemo(() => {
    const groups = new Map<string, Bookmark[]>();
    for (const b of filtered) {
      const list = groups.get(b.courseID) ?? [];
      list.push(b);
      groups.set(b.courseID, list);
    }
    return [...groups.entries()];
  }, [filtered]);

  const countFor = (tt: Tab): number =>
    tt === 'all' ? all.length : all.filter((b) => kindOf(b) === TAB_KINDS[tt]).length;

  const emptyKey =
    tab === 'module'
      ? 'bookmarks.emptyModules'
      : tab === 'section'
        ? 'bookmarks.emptySections'
        : tab === 'highlight'
          ? 'bookmarks.emptyHighlights'
          : 'bookmarks.noBookmarks';

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await remove(id);
  };

  if (allLoading) {
    return <div className={loadingIndicator()}>{t('bookmarks.loadingBookmarks')}</div>;
  }

  return (
    <PageLayout>
      <PageHeader onBack={onBack} title={t('bookmarks.savedTitle')} hideHeaderActions />
      <PageContent className="px-6 py-8">
        <div className="flex gap-2 mb-4 flex-wrap" data-testid="saved-tabs">
          {(['all', 'module', 'section', 'highlight'] as const).map((tt) => (
            <button
              key={tt}
              onClick={() => setTab(tt)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                tab === tt
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                  : 'text-gray-500 hover:text-gray-300 border border-gray-700/50'
              }`}
            >
              {t(`bookmarks.tab${tt.charAt(0).toUpperCase()}${tt.slice(1)}`, {
                count: countFor(tt),
              })}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 mb-6 flex-wrap">
          <button
            onClick={() => setCourseFilter(null)}
            className={`px-2.5 py-0.5 text-[11px] rounded-full border transition-colors ${
              courseFilter === null
                ? 'bg-gray-700 text-gray-100 border-gray-600'
                : 'text-gray-500 border-gray-700/60 hover:text-gray-300'
            }`}
          >
            {t('bookmarks.allCourses')}
          </button>
          {courses.map((c: Course) => (
            <button
              key={c.id}
              onClick={() => setCourseFilter(c.id)}
              className={`px-2.5 py-0.5 text-[11px] rounded-full border transition-colors ${
                courseFilter === c.id
                  ? 'bg-gray-700 text-gray-100 border-gray-600'
                  : 'text-gray-500 border-gray-700/60 hover:text-gray-300'
              }`}
            >
              {c.displayName}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-12">{t(emptyKey)}</p>
        ) : (
          <div className="space-y-6">
            {byCourse.map(([courseID, items]) => {
              const course = courses.find((c: Course) => c.id === courseID);
              return (
                <div key={courseID}>
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    {course?.displayName ?? courseID}
                  </h2>
                  <div className="space-y-2">
                    {items.map((b) => {
                      const kind = kindOf(b);
                      const KindIcon = KIND_ICON[kind];
                      return (
                        <div
                          key={b.id}
                          className="bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl transition-colors group relative"
                        >
                          <button
                            onClick={() => onOpen(b.courseID, b.moduleID, b.sectionID, courses)}
                            className="w-full text-left p-4 pr-10"
                            data-testid="saved-item"
                          >
                            <div className="flex items-center gap-2">
                              <KindIcon size={13} className="text-indigo-400 shrink-0" />
                              <h3 className="text-sm font-medium text-indigo-300 truncate">
                                {b.title}
                              </h3>
                            </div>
                            {kind === 'highlight' && b.snippet && (
                              <p className="text-xs text-gray-300 mt-1.5 line-clamp-2 border-l-2 border-indigo-500/40 pl-2">
                                {b.snippet}
                              </p>
                            )}
                            <p className="text-[10px] text-gray-500 mt-1">
                              {course?.modules.find((m) => m.id === b.moduleID)?.name ?? ''}
                            </p>
                            <p className="text-[10px] text-gray-600 mt-0.5">
                              {new Date(b.createdAt).toLocaleDateString()}
                            </p>
                          </button>
                          <button
                            onClick={(e) => {
                              void handleDelete(e, b.id);
                            }}
                            className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 px-2 py-0.5 text-xs bg-red-800 hover:bg-red-700 rounded transition-all"
                            title={t('common.deleteBookmark')}
                          >
                            {t('common.delete')}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}
