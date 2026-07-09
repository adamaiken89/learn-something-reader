import { useEffect, useRef } from 'react';

import type { Course, ModuleMeta } from '../../bun/types';
import { api } from '../api';
import { useLessonUIStore } from '../stores/lessonUIStore';
import { useLessonViewStore } from '../stores/lessonViewStore';

function write(course: Course, module: ModuleMeta, sectionId: string, scrollPosition: number) {
  return api.session.set({
    course,
    module,
    sectionId,
    scrollPosition,
    updatedAt: new Date().toISOString(),
  });
}

export function useLastSession(course: Course, module: ModuleMeta) {
  const visibleSection = useLessonUIStore((s) => s.visibleSection);
  const contentRef = useLessonViewStore((s) => s.contentRef);
  const sectionRef = useRef(visibleSection);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const skipFirstSection = useRef(true);

  sectionRef.current = visibleSection;

  useEffect(() => {
    const scrollPosition = contentRef.current?.scrollTop ?? 0;
    void write(course, module, visibleSection ?? '', scrollPosition);
    skipFirstSection.current = false;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (skipFirstSection.current) return;
    if (!visibleSection) return;
    const scrollPosition = contentRef.current?.scrollTop ?? 0;
    void write(course, module, visibleSection, scrollPosition);
  }, [visibleSection]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void write(course, module, sectionRef.current ?? '', el.scrollTop);
      }, 500);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [course, module, contentRef]);
}
