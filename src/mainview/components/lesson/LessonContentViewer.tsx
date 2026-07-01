import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import type { PluggableList } from 'unified';
import { useShallow } from 'zustand/react/shallow';

import type { MetaField } from '../../../bun/lessonMarkdown';
import { COMPLETION_GREEN, COMPLETION_GREEN_DARK, SECTION_ACTIVE_TEXT } from '../../colors';
import { useAutoCopy } from '../../hooks/useAutoCopy';
import { useDelayedUnmount } from '../../hooks/useDelayedUnmount';
import { useNotePopoverOnClick } from '../../hooks/useNotePopoverOnClick';
import { useNotes } from '../../hooks/useNotes';
import { useSelection } from '../../hooks/useSelection';
import { components } from '../../sections/lessonHelpers';
import LessonSelectionOverlays from '../../sections/LessonSelectionOverlays';
import { useSettingsStore } from '../../stores/settingsStore';
import { THEME_TOKENS,themeToCSSVars } from '../../themes';
import ViewerSearch from './ViewerSearch';

interface LessonContentViewerProps {
  courseId: string;
  moduleId: string;
  onRefreshHighlights: () => void;
  contentRef: RefObject<HTMLDivElement | null>;
  h1: string;
  meta: MetaField[];
  bodyContent: string;
  handleScroll: () => void;
  isCompleted: boolean;
  toggleCompleted: () => void;
  rehypePlugins: PluggableList;
  searchActive: boolean;
  searchQuery: string;
  searchTotalMatches: number;
  searchCurrentMatch: number;
  onSearchQueryChange: (q: string) => void;
  onSearchPrev: () => void;
  onSearchNext: () => void;
  onSearchClose: () => void;
}

export default function LessonContentViewer({
  courseId,
  moduleId,
  onRefreshHighlights,
  contentRef,
  h1,
  meta,
  bodyContent,
  handleScroll,
  isCompleted,
  toggleCompleted,
  rehypePlugins,
  searchActive,
  searchQuery,
  searchTotalMatches,
  searchCurrentMatch,
  onSearchQueryChange,
  onSearchPrev,
  onSearchNext,
  onSearchClose,
}: LessonContentViewerProps) {
  const { t } = useTranslation();

  const { contentWidth, fontSize, theme } = useSettingsStore(
    useShallow((s) => ({ contentWidth: s.contentWidth, fontSize: s.fontSize, theme: s.theme })),
  );
  const themeVars = themeToCSSVars(THEME_TOKENS[theme]);

  const { notes } = useNotes(courseId, moduleId);
  const selectionState = useSelection(contentRef);
  const { handleTextSelectionWithAutoCopy } = useAutoCopy(
    selectionState.handleTextSelection,
  );
  useNotePopoverOnClick(
    contentRef,
    notes,
    selectionState.setSelectedHighlight,
    selectionState.handleTextSelection,
  );

  const showSearch = useDelayedUnmount(searchActive, 200);

  return (
    <div
      className="flex-1 overflow-y-auto"
      data-testid="lesson-content"
      ref={contentRef}
      tabIndex={-1}
      onScroll={handleScroll}
      onMouseUp={handleTextSelectionWithAutoCopy}
    >
      {showSearch && (
        <div
          className={`sticky top-0 z-10 ${searchActive ? 'anim-fade-in-up' : 'anim-fade-out'}`}
        >
          <ViewerSearch
            query={searchQuery}
            totalMatches={searchTotalMatches}
            currentMatch={searchCurrentMatch}
            onQueryChange={onSearchQueryChange}
            onPrev={onSearchPrev}
            onNext={onSearchNext}
            onClose={onSearchClose}
          />
        </div>
      )}
      <div
        className={`p-6 book-content${contentWidth === 'wide' ? ' book-content-wide' : contentWidth === 'standard' ? ' book-content-standard' : ''}`}
        style={{ fontSize: `${fontSize}px`, ...themeVars }}
      >
        {h1 && (
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            rehypePlugins={rehypePlugins}
            components={components}
          >
            {`# ${h1}`}
          </ReactMarkdown>
        )}
        {meta.length > 0 && (
          <div className="lesson-meta">
            {meta.map((m, i) => {
              const isDesc = m.key === 'description';
              return (
                <span key={m.key} style={isDesc ? { flexBasis: '100%' } : undefined}>
                  {!isDesc && i > 0 && <span className="meta-divider" />}
                  <span className={`meta-item${isDesc ? ' meta-description' : ''}`}>
                    <span className="meta-icon">{m.icon}</span>
                    <span className="meta-label">{m.label}</span>
                    <span className="meta-value">{m.value}</span>
                  </span>
                </span>
              );
            })}
          </div>
        )}
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          rehypePlugins={rehypePlugins}
          components={components}
        >
          {bodyContent}
        </ReactMarkdown>

        <div style={{ height: '50vh' }} />

        <div style={{ marginTop: '3rem' }}>
          <button
            onClick={() => { void toggleCompleted(); }}
            data-testid="complete-btn"
            className="w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200"
            style={{
              background: isCompleted
                ? `linear-gradient(135deg, ${COMPLETION_GREEN}, ${COMPLETION_GREEN_DARK})`
                : 'var(--book-code-bg)',
              color: isCompleted ? SECTION_ACTIVE_TEXT : 'var(--book-text)',
              border: `1px solid ${isCompleted ? COMPLETION_GREEN_DARK : 'var(--book-h2-border)'}`,
            }}
          >
            {isCompleted ? t('lesson.completed') : t('lesson.markAsComplete')}
          </button>
        </div>
      </div>

      <LessonSelectionOverlays
        courseId={courseId}
        moduleId={moduleId}
        contentRef={contentRef}
        onRefreshHighlights={onRefreshHighlights}
      />
    </div>
  );
}
