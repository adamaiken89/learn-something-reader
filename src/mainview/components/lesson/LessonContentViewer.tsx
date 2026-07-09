import { useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import type { PluggableList } from 'unified';
import { useShallow } from 'zustand/react/shallow';

import { useAutoCopy } from '../../hooks/useAutoCopy';
import { useHighlights } from '../../hooks/useHighlights';
import { findVisibleHeading } from '../../hooks/useLesson';
import type { UseLessonSearchReturn } from '../../hooks/useLessonSearch';
import { useNotePopoverOnClick } from '../../hooks/useNotePopoverOnClick';
import { useNotes } from '../../hooks/useNotes';
import { useSelection } from '../../hooks/useSelection';
import { components as lessonComponents } from '../../sections/lessonHelpers';
import { useHighlightsStore } from '../../stores/highlightsStore';
import { useLessonUIStore } from '../../stores/lessonUIStore';
import { useLessonViewStore } from '../../stores/lessonViewStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { THEME_TOKENS, themeToCSSVars } from '../../themes';
import { rehypeCloze } from '../rehypeCloze';
import { rehypeHighlightText } from '../rehypeHighlightText';
import { rehypeSearchText } from '../rehypeSearchText';
import ClozeBlank from './ClozeBlank';
import LessonContentCompletionButton from './LessonContentCompletionButton';
import LessonContentHeader from './LessonContentHeader';
import NotePopover from './NotePopover';
import SelectionToolbar from './SelectionToolbar';

interface LessonContentViewerProps {
  search: UseLessonSearchReturn;
}

export default function LessonContentViewer({ search }: LessonContentViewerProps) {
  const contentRef = useLessonViewStore((s) => s.contentRef);
  const bodyContent = useLessonViewStore((s) => s.bodyContent);
  const sections = useLessonViewStore((s) => s.sections);
  const courseId = useLessonViewStore((s) => s.courseId);
  const moduleId = useLessonViewStore((s) => s.moduleId);

  const { contentWidth, fontSize, theme } = useSettingsStore(
    useShallow((s) => ({
      contentWidth: s.contentWidth,
      fontSize: s.fontSize,
      theme: s.theme,
    })),
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

  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const id = findVisibleHeading(el, sections);
    useLessonUIStore.getState().setVisibleSection(id);
  }, [contentRef, sections]);

  const highlights = useHighlightsStore((s) => s.byModule[`${courseId}:${moduleId}`]);

  const rehypePlugins = useMemo(
    () =>
      [
        rehypeHighlight,
        [rehypeHighlightText, highlights ?? []],
        rehypeCloze,
        ...(search.searchActive && search.searchQuery
          ? [[rehypeSearchText, search.searchQuery, search.caseSensitive]]
          : []),
      ] as PluggableList,
    [highlights, search.searchActive, search.searchQuery, search.caseSensitive],
  );

  return (
    <>
      <div className="flex-1 flex flex-col overflow-clip min-h-0">
        <div
          className="flex-1 overflow-y-auto min-h-0"
          data-testid="lesson-content"
          ref={contentRef}
          tabIndex={-1}
          onScroll={handleScroll}
        >
          <div
            className={`p-6 book-content${contentWidth === 'wide' ? ' book-content-wide' : contentWidth === 'standard' ? ' book-content-standard' : ''}`}
            data-testid="book-content-area"
            style={{ fontSize: `${fontSize}px`, ...themeVars }}
            onMouseUp={handleTextSelectionWithAutoCopy}
          >
            <LessonContentHeader rehypePlugins={rehypePlugins} />
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              rehypePlugins={rehypePlugins}
              components={{
                ...lessonComponents,
                span: ({ className, ...props }) => {
                  if (className?.includes('cloze-blank')) {
                    return (
                      <ClozeBlank answer={(props as Record<string, string>)['data-answer'] || ''} />
                    );
                  }
                  return <span className={className} {...props} />;
                },
              }}
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
    </>
  );
}
