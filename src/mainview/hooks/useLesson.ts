import { useCallback, useEffect, useRef, useState } from 'react';

import type { Section } from '../../bun/types';
import { api } from '../api';
import { logger } from '../logger';
import { useLessonUIStore } from '../stores/lessonUIStore';
import { useLessonViewStore } from '../stores/lessonViewStore';
import { showToast } from '../toast';

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

  const scrollToSection = useCallback((sectionId: string) => {
    const container = contentRef.current;
    if (!container) {
      logger.debug({ sectionId }, 'scrollToSection: no container');
      return;
    }
    const el = container.querySelector(`[id="${sectionId}"]`);
    if (!el) {
      const ids = Array.from(container.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((h) => h.id);
      logger.debug({ sectionId, ids }, 'scrollToSection: element not found');
      return;
    }
    const offset =
      el.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop -
      20;
    logger.debug({ sectionId, offset }, 'scrollToSection: scrolling');
    container.scrollTop = offset;
    container.focus();
  }, []);

  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const id = findVisibleHeading(el, sectionsRef.current);
    useLessonUIStore.getState().setVisibleSection(id);
    logger.debug({ id, sectionsCount: sectionsRef.current.length }, 'handleScroll');
  }, []);

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
        vs.setScrollToSection(scrollToSection);
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
  }, [courseId, moduleId, handleScroll, scrollToSection]);

  useEffect(() => {
    if (initialSectionID) {
      const unsubscribe = useLessonViewStore.subscribe((state) => {
        if (state.content) {
          requestAnimationFrame(() => {
            scrollToSection(initialSectionID);
          });
          unsubscribe();
        }
      });
      // If content already loaded, scroll immediately
      if (useLessonViewStore.getState().content) {
        requestAnimationFrame(() => {
          scrollToSection(initialSectionID);
        });
        unsubscribe();
      }
      return () => unsubscribe();
    }
  }, [initialSectionID, scrollToSection]);

  return {
    loading,
    contentRef,
    scrollToSection,
    handleScroll,
  };
}
