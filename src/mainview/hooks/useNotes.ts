import { useEffect } from 'react';

import type { Note } from '../../bun/types';
import { useNotesStore } from '../stores/notesStore';

interface UseNotesReturn {
  notes: Note[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useNotes(courseId: string, moduleId: string | number): UseNotesReturn {
  const load = useNotesStore((s) => s.load);
  const byModule = useNotesStore((s) => s.byModule);
  const loading = useNotesStore((s) => s.loading[`${courseId}:${moduleId}`] ?? false);

  useEffect(() => {
    void load(courseId, moduleId);
  }, [courseId, moduleId, load]);

  const k = `${courseId}:${moduleId}`;
  const notes = byModule[k] ?? [];

  return { notes, loading, refresh: () => load(courseId, moduleId) };
}
