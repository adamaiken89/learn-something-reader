import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';

import type { SearchResult } from '../../bun/search';
import { api } from '../api';
import { useCourseStore } from '../stores/courseStore';
import { useViewStore } from '../stores/viewStore';
import { showToast } from '../toast';

interface UseSearchOverlayProps {
  initialCourseIDs?: string[];
  onClose: () => void;
}

export interface UseSearchOverlayReturn {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResult[];
  loading: boolean;
  courseFilters: string[];
  selectedIdx: number;
  inputRef: React.RefObject<HTMLInputElement | null>;
  resultsRef: React.RefObject<HTMLDivElement | null>;
  closing: boolean;
  handleClose: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleSelectionChange: (ids: string[]) => void;
  navigate: (courseID: string, moduleID: string, sectionID?: string) => void;
  groupedResults: Map<string, { courseName: string; items: { r: SearchResult; idx: number }[] }>;
}

export function useSearchOverlay({
  initialCourseIDs,
  onClose,
}: UseSearchOverlayProps): UseSearchOverlayReturn {
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleClose = useCallback(() => {
    setClosing(true);
    closeTimerRef.current = setTimeout(() => onClose(), 200);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const courses = useCourseStore((s) => s.courses);
  const push = useViewStore((s) => s.push);
  const [, startTransition] = useTransition();

  const navigate = useCallback(
    (courseID: string, moduleID: string, sectionID?: string) => {
      const c = courses.find((x) => x.id === courseID);
      const m = c?.modules.find((x) => x.id === moduleID);
      if (c && m) {
        push({ type: 'lesson', course: c, module: m, sectionID });
      }
    },
    [courses, push],
  );

  const [query, setQuery] = useState('');
  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [courseFilters, setCourseFilters] = useState<string[]>(() => initialCourseIDs ?? []);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const resultsRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (courseFilters.length === 0) return allResults;
    return allResults.filter((r) => courseFilters.includes(r.courseID));
  }, [allResults, courseFilters]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) {
      setAllResults([]);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(() => {
      void (async () => {
        try {
          const res = await api.search(query);
          setAllResults(res);
          setSelectedIdx(-1);
        } catch {
          showToast.error('toast.loadFailed');
          setAllResults([]);
        } finally {
          setLoading(false);
        }
      })();
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  const handleSelectionChange = useCallback((ids: string[]) => {
    setCourseFilters(ids);
    setSelectedIdx(-1);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        inputRef.current?.select();
        return;
      }
      if (e.key === 'Escape') {
        handleClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' && selectedIdx >= 0 && selectedIdx < results.length) {
        e.preventDefault();
        const r = results[selectedIdx];
        navigate(r.courseID, r.moduleID, r.sectionID);
        handleClose();
      }
    },
    [handleClose, results, selectedIdx, navigate],
  );

  const groupedResults = useMemo(() => {
    const grouped = new Map<
      string,
      { courseName: string; items: { r: SearchResult; idx: number }[] }
    >();
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const existing = grouped.get(r.courseID);
      if (existing) {
        existing.items.push({ r, idx: i });
      } else {
        grouped.set(r.courseID, {
          courseName: r.courseName,
          items: [{ r, idx: i }],
        });
      }
    }
    return grouped;
  }, [results]);

  const querySetter = useCallback(
    (q: string) => startTransition(() => setQuery(q)),
    [startTransition],
  );

  return {
    query,
    setQuery: querySetter,
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
  };
}
