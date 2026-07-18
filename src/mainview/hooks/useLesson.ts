import { useEffect, useEffectEvent, useRef, useState } from 'react';

import type { Section } from '../../bun/types';
import { api } from '../api';
import { logger } from '../logger';
import { useLessonUIStore } from '../stores/lessonUIStore';
import { useLessonViewStore } from '../stores/lessonViewStore';
import { showToast } from '../toast';
import { useScrollToSection } from './useScrollToSection';

type DivRef = React.RefObject<HTMLDivElement>;

const SCROLL_OFFSET = 120;

export function findVisibleHeading(container: HTMLElement, sections: Section[]): string | null {
  if (sections.length === 0) return null;

  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  if (headings.length === 0) return null;

  const containerRect = container.getBoundingClientRect();
  const threshold = containerRect.top + SCROLL_OFFSET;

  let bestId: string | null = null;

  for (const h of headings) {
    if (h.getBoundingClientRect().top <= threshold) {
      bestId = h.id;
    }
  }

  return bestId;
}

interface UseLessonReturn {
  loading: boolean;
  contentRef: DivRef;
  scrollToSection: (sectionId: string) => void;
  handleScroll: () => void;
}

interface UseLessonCompletion {
  toggle: (courseId: string, moduleId: string) => Promise<void>;
}

export function useLesson(
  courseId: string,
  moduleId: string,
  _completion: UseLessonCompletion,
  initialSectionID?: string,
): UseLessonReturn {
  const [loading, setLoading] = useState(true);

  const contentRef = useRef<HTMLDivElement>(null) as DivRef;
  const sectionsRef = useRef<Section[]>([]);

  const scrollToSection = useScrollToSection(contentRef);
  const scrollTo = useEffectEvent(scrollToSection);

  const readingSession = useRef({
    courseId: '',
    moduleId: '',
    accumulated: 0,
    lastActivity: Date.now(),
    lastTick: Date.now(),
  });

  const flushReadingSession = useEffectEvent(() => {
    const s = readingSession.current;
    if (s.accumulated < 1) return;
    api.stats
      .logSession({
        courseID: s.courseId,
        moduleID: s.moduleId,
        durationMinutes: s.accumulated,
        type: 'reading',
      })
      .catch(() => {});
    s.accumulated = 0;
  });

  const handleActivity = useEffectEvent(() => {
    readingSession.current.lastActivity = Date.now();
  });

  useEffect(() => {
    if (!courseId || !moduleId || loading) return;
    const s = readingSession.current;
    s.courseId = courseId;
    s.moduleId = moduleId;
    s.lastActivity = Date.now();
    s.lastTick = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - s.lastTick) / 60000);
      if (elapsed > 0 && now - s.lastActivity < 300000) {
        s.accumulated += elapsed;
      }
      s.lastTick = now;
    }, 60000);

    const el = contentRef.current;
    if (el) {
      el.addEventListener('scroll', handleActivity, { passive: true });
      el.addEventListener('mousedown', handleActivity, { passive: true });
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        flushReadingSession();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      if (el) {
        el.removeEventListener('scroll', handleActivity);
        el.removeEventListener('mousedown', handleActivity);
      }
      document.removeEventListener('visibilitychange', onVisibility);
      flushReadingSession();
    };
  }, [courseId, moduleId, loading]);

  const handleScroll = () => {
    const el = contentRef.current;
    if (!el) return;
    const id = findVisibleHeading(el, sectionsRef.current);
    useLessonUIStore.getState().setVisibleSection(id);
    logger.debug({ id, sectionsCount: sectionsRef.current.length }, 'handleScroll');
  };

  useEffect(() => {
    setLoading(true);
    contentRef.current?.scrollTo(0, 0);
    api.courses
      .lesson(courseId, moduleId)
      .then((lesson) => {
        sectionsRef.current = lesson.sections;
        const vs = useLessonViewStore.getState();
        vs.setContent(lesson.content);
        vs.setH1(lesson.h1);
        vs.setMeta(lesson.meta);
        vs.setBodyContent(lesson.bodyContent);
        vs.setSections(lesson.sections);
        vs.setContentRef(contentRef);
        vs.setScrollToSection(scrollTo);
        vs.setCourseId(courseId);
        vs.setModuleId(moduleId);
        vs.setLoading(false);
        setLoading(false);
        requestAnimationFrame(() => {
          contentRef.current?.focus();
          handleScroll();
        });
      })
      .catch((err) => {
        logger.warn({ err }, 'Failed to load lesson');
        showToast.error('toast.loadFailed');
        useLessonViewStore.getState().setLoading(false);
        setLoading(false);
      });
  }, [courseId, moduleId]);

  useEffect(() => {
    if (initialSectionID) {
      const unsubscribe = useLessonViewStore.subscribe((state) => {
        if (state.content) {
          requestAnimationFrame(() => {
            scrollTo(initialSectionID);
          });
          unsubscribe();
        }
      });
      if (useLessonViewStore.getState().content) {
        requestAnimationFrame(() => {
          scrollTo(initialSectionID);
        });
        unsubscribe();
      }
      return () => unsubscribe();
    }
  }, [initialSectionID]);

  return {
    loading,
    contentRef,
    scrollToSection,
    handleScroll,
  };
}
