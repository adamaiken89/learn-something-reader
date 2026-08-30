import { Bookmark, Search, Settings } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import CourseGrid from '../components/dashboard/CourseGrid';
import EmptyState from '../components/dashboard/EmptyState';
import ResumeCard from '../components/dashboard/ResumeCard';
import ReviewNowPanel from '../components/dashboard/ReviewNowPanel';
import StatsBar from '../components/dashboard/StatsBar';
import SearchOverlay from '../components/SearchOverlay';
import { useDashboard } from '../hooks/useDashboard';
import { useQuizDueStatus } from '../hooks/useQuizDueStatus';
import PageContent from '../layouts/PageContent';
import PageHeader from '../layouts/PageHeader';
import PageLayout from '../layouts/PageLayout';
import { useViewStore } from '../stores/viewStore';

function greetingKey(): string {
  const h = new Date().getHours();
  if (h < 12) return 'dashboard.greetingMorning';
  if (h < 18) return 'dashboard.greetingAfternoon';
  return 'dashboard.greetingEvening';
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { courses, lastSession, globalStats, loading } = useDashboard();
  const { ready, overdue, loading: dueLoading } = useQuizDueStatus();
  const push = useViewStore((s) => s.push);
  const [searchOpen, setSearchOpen] = useState(false);

  const iconBtn =
    'p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700/60 rounded-md transition-colors';

  const headerActions = (
    <div className="flex items-center gap-1.5">
      <button onClick={() => setSearchOpen(true)} className={iconBtn} title={t('app.search')}>
        <Search size={14} />
      </button>
      <button
        onClick={() => push({ type: 'bookmarks' })}
        className={iconBtn}
        title={t('common.saved')}
      >
        <Bookmark size={14} />
      </button>
      <button
        onClick={() => push({ type: 'settings' })}
        className={iconBtn}
        title={t('common.settings')}
      >
        <Settings size={14} />
      </button>
    </div>
  );

  if (loading) {
    return (
      <PageLayout className="dashboard-bg">
        <PageHeader title={t('dashboard.title')} actions={headerActions} />
        <PageContent className="px-6 py-4">
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-gray-700/50 rounded-lg" />
            <div className="h-16 bg-gray-700/50 rounded-lg" />
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-700/50 rounded-lg" />
              ))}
            </div>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="dashboard-bg">
      <PageHeader title={t('dashboard.title')} actions={headerActions} />
      <PageContent className="px-6 py-4">
        <div className="anim-fade-in-up">
          <p className="text-xs text-gray-400 mb-3">{t(greetingKey())}.</p>
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 min-w-0">
              {lastSession && <ResumeCard lastSession={lastSession} />}
            </div>
            {globalStats && (
              <div className="lg:w-[380px] shrink-0">
                <StatsBar stats={globalStats} />
              </div>
            )}
          </div>
        </div>

        <div className="anim-fade-in-up mt-3" style={{ animationDelay: '80ms' }}>
          <ReviewNowPanel
            courses={courses}
            globalStats={globalStats}
            ready={ready}
            overdue={overdue}
            loading={dueLoading}
          />
        </div>

        <div className="anim-fade-in-up mt-3" style={{ animationDelay: '160ms' }}>
          {courses.length === 0 ? <EmptyState /> : <CourseGrid />}
        </div>
      </PageContent>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </PageLayout>
  );
}
