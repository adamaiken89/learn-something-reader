import { useEffect, useState } from 'react';

import type { GlobalStats } from '../../bun/stats';
import type { LastSession } from '../../bun/types';
import { api } from '../api';
import { useCourseStore } from '../stores/courseStore';

export function useDashboard() {
  const courses = useCourseStore((s) => s.courses);
  const [lastSession, setLastSession] = useState<LastSession | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([api.session.get(), api.stats.global()]).then(([sess, stats]) => {
      if (cancelled) return;
      setLastSession(sess);
      setGlobalStats(stats);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { courses, lastSession, globalStats, loading };
}
