import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { CourseStats, GlobalStats } from '../../bun/stats';
import { api } from '../api';
import PageContent from '../layouts/PageContent';
import PageHeader from '../layouts/PageHeader';
import PageLayout from '../layouts/PageLayout';
import { logger } from '../logger';
import { showToast } from '../toast';
import CourseStatsView from './dashboard/CourseStatsView';
import GlobalStatsView from './dashboard/GlobalStatsView';

interface DashboardPageProps {
  courseID?: string;
  onBack: () => void;
}

export default function DashboardPage({ courseID, onBack }: DashboardPageProps) {
  const { t } = useTranslation();
  const [courseStats, setCourseStats] = useState<CourseStats | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetchStats = courseID ? api.stats.course(courseID) : api.stats.global();

    fetchStats
      .then((s) => {
        if (courseID) setCourseStats(s as CourseStats);
        else setGlobalStats(s as GlobalStats);
        setLoading(false);
      })
      .catch((err) => {
        logger.warn({ err }, 'Failed to load stats');
        showToast.error('toast.loadFailed');
        setLoading(false);
      });
  }, [courseID]);

  if (loading) {
    return (
      <PageLayout>
        <PageHeader onBack={onBack} title={t('dashboard.title')} />
        <PageContent>
          <div className="text-center text-gray-500 py-12">{t('common.loading')}</div>
        </PageContent>
      </PageLayout>
    );
  }

  if (courseStats) {
    return (
      <PageLayout>
        <PageHeader onBack={onBack} title={t('dashboard.courseStats')} />
        <PageContent className="max-w-2xl mx-auto w-full">
          <CourseStatsView stats={courseStats} />
        </PageContent>
      </PageLayout>
    );
  }

  if (globalStats) {
    return (
      <PageLayout>
        <PageHeader onBack={onBack} title={t('dashboard.globalStats')} />
        <PageContent className="max-w-2xl mx-auto w-full">
          <GlobalStatsView stats={globalStats} />
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader onBack={onBack} title={t('dashboard.title')} />
      <PageContent>
        <div className="text-center text-gray-500 py-12">{t('dashboard.noData')}</div>
      </PageContent>
    </PageLayout>
  );
}
