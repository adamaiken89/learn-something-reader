import { useCallback, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import type { PluggableList } from 'unified';
import { useShallow } from 'zustand/react/shallow';

import { useAutoCopy } from '../../hooks/useAutoCopy';
import { useDelayedUnmount } from '../../hooks/useDelayedUnmount';
import { useHighlights } from '../../hooks/useHighlights';
import { findVisibleHeading } from '../../hooks/useLesson';
import { useLessonSearch } from '../../hooks/useLessonSearch';
import { useNotePopoverOnClick } from '../../hooks/useNotePopoverOnClick';
import { useNotes } from '../../hooks/useNotes';
import { useSelection } from '../../hooks/useSelection';
import { components } from '../../sections/lessonHelpers';
import { useHighlightsStore } from '../../stores/highlightsStore';
import { useLessonUIStore } from '../../stores/lessonUIStore';
import { useLessonViewStore } from '../../stores/lessonViewStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { THEME_TOKENS, themeToCSSVars } from '../../themes';
import { rehypeHighlightText } from '../rehypeHighlightText';
import { rehypeSearchText } from '../rehypeSearchText';
import CardEditor from './CardEditor';
import LessonContentCompletionButton from './LessonContentCompletionButton';
import LessonContentHeader from './LessonContentHeader';
import NoteEditor from './NoteEditor';
import NotePopover from './NotePopover';
import SelectionToolbar from './SelectionToolbar';
import ViewerSearch from './ViewerSearch';

interface LessonContentViewerProps {
  initialSearchQuery?: string | null;
}

export default function LessonContentViewer({ initialSearchQuery }: LessonContentViewerProps) {
  const contentRef = useLessonViewStore((s) => s.contentRef);
  const bodyContent = useLessonViewStore((s) => s.bodyContent);
  const sections = useLessonViewStore((s) => s.sections);
  const searchTrigger = useLessonViewStore((s) => s.searchTrigger);
  const courseId = useLessonViewStore((s) => s.courseId);
  const moduleId = useLessonViewStore((s) => s.moduleId);

  const { contentWidth, fontSize, theme } = useSettingsStore(
    useShallow((s) => ({ contentWidth: s.contentWidth, fontSize: s.fontSize, theme: s.theme })),
  );
  const themeVars = themeToCSSVars(THEME_TOKENS[theme]);

  const { notes } = useNotes(courseId, moduleId);
  useHighlights(courseId, moduleId);
  const selectionState = useSelection(contentRef);
  const { handleTextSelectionWithAutoCopy } = useAutoCopy(selectionState.handleTextSelection);
  useNotePopoverOnClick(
    contentRef,
    notes,
    selectionState.setSelectedHighlight,
    selectionState.handleTextSelection,
  );

  const search = useLessonSearch(contentRef, moduleId, initialSearchQuery);
  const { setSearchActive } = search;

  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const id = findVisibleHeading(el, sections);
    useLessonUIStore.getState().setVisibleSection(id);
  }, [contentRef, sections]);

  useEffect(() => {
    if (searchTrigger > 0) setSearchActive(true);
  }, [searchTrigger, setSearchActive]);

  const highlights = useHighlightsStore((s) => s.byModule[`${courseId}:${moduleId}`]);

  const rehypePlugins = useMemo(
    () =>
      [
        rehypeHighlight,
        [rehypeHighlightText, highlights ?? []],
        ...(search.searchActive && search.searchQuery
          ? [[rehypeSearchText, search.searchQuery]]
          : []),
      ] as PluggableList,
    [highlights, search.searchActive, search.searchQuery],
  );

  const showSearch = useDelayedUnmount(search.searchActive, 200);

  return (
    <>
      <div className="relative flex-1 overflow-hidden">
        {showSearch && (
          <div
            className={`absolute top-0 left-0 right-0 z-10 ${search.searchActive ? 'anim-fade-in-up' : 'anim-fade-out'}`}
          >
            <ViewerSearch search={search} />
          </div>
        )}
        <div
          className="flex-1 overflow-y-auto h-full"
          data-testid="lesson-content"
          ref={contentRef}
          tabIndex={-1}
          onScroll={handleScroll}
          onMouseUp={handleTextSelectionWithAutoCopy}
        >
          <div
            className={`p-6 book-content${contentWidth === 'wide' ? ' book-content-wide' : contentWidth === 'standard' ? ' book-content-standard' : ''}`}
            style={{ fontSize: `${fontSize}px`, ...themeVars }}
          >
            <LessonContentHeader rehypePlugins={rehypePlugins} />
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              rehypePlugins={rehypePlugins}
              components={components}
            >
              {bodyContent}
            </ReactMarkdown>

            <div style={{ height: '50vh' }} />

            <LessonContentCompletionButton />
          </div>
        </div>
      </div>

      <SelectionToolbar />
      <NotePopover />
      <CardEditor />
      <NoteEditor />
    </>
  );
}
