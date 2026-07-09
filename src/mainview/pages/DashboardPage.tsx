import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import CourseGrid from '../components/dashboard/CourseGrid';
import EmptyState from '../components/dashboard/EmptyState';
import ResumeCard from '../components/dashboard/ResumeCard';
import StatsBar from '../components/dashboard/StatsBar';
import SearchOverlay from '../components/SearchOverlay';
import { useDashboard } from '../hooks/useDashboard';
import PageContent from '../layouts/PageContent';
import PageHeader from '../layouts/PageHeader';
import PageLayout from '../layouts/PageLayout';
import { useViewStore } from '../stores/viewStore';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { courses, lastSession, globalStats, loading } = useDashboard();
  const push = useViewStore((s) => s.push);
  const [searchOpen, setSearchOpen] = useState(false);

  const headerBtnClass =
    'px-3 py-1.5 text-sm bg-gray-800/50 border border-gray-700 text-gray-400 hover:bg-gray-700/50 hover:text-gray-300 rounded-lg transition-colors';

  const headerActions = (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => setSearchOpen(true)}
        className={headerBtnClass}
        title={t('app.search')}
      >
        {t('app.search')}
      </button>
      <button onClick={() => push({ type: 'bookmarks' })} className={headerBtnClass}>
        {t('common.bookmarks')}
      </button>
      <button onClick={() => push({ type: 'settings' })} className={headerBtnClass}>
        {t('common.settings')}
      </button>
    </div>
  );

  if (loading) {
    return (
      <PageLayout>
        <PageHeader title={t('dashboard.title')} actions={headerActions} />
        <PageContent>
          <div className="text-center text-gray-500 py-12">{t('common.loading')}</div>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader title={t('dashboard.title')} actions={headerActions} />
      <PageContent>
        {lastSession && <ResumeCard lastSession={lastSession} />}

        {globalStats && <StatsBar stats={globalStats} />}

        {courses.length === 0 ? <EmptyState /> : <CourseGrid />}
      </PageContent>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </PageLayout>
  );
}
