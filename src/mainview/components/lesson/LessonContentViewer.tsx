import clsx from 'clsx';
import { ExternalLink } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import type { PluggableList } from 'unified';
import { useShallow } from 'zustand/react/shallow';

import { AI_SKILLS } from '../../ai/skills';
import { copyPrompt, stripContentForAI } from '../../ai/utils';
import { api } from '../../api';
import { useAutoCopy } from '../../hooks/useAutoCopy';
import { useCurrentLesson } from '../../hooks/useCurrentLesson';
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
import { useViewStore } from '../../stores/viewStore';
import { THEME_TOKENS, themeToCSSVars } from '../../themes';
import { rehypeCloze } from '../rehypeCloze';
import { rehypeHighlightText } from '../rehypeHighlightText';
import { rehypeSearchText } from '../rehypeSearchText';
import ClozeBlank from './ClozeBlank';
import LessonContentCompletionButton from './LessonContentCompletionButton';
import LessonContentHeader from './LessonContentHeader';
import LessonWarmUpBar from './LessonWarmUpBar';
import NotePopover from './NotePopover';
import SelectionToolbar from './SelectionToolbar';

const PERPLEXITY_PLACEHOLDER = '%%PERPLEXITY%%:';

function matchSectionUntilEnd(content: string, heading: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const middle = content.match(new RegExp(`^## ${escaped}[\\s\\S]*?(?=\\n## )`, 'm'));
  if (middle) return middle[0];
  const last = content.match(new RegExp(`^## ${escaped}[\\s\\S]*$`, 'm'));
  return last?.[0] ?? '';
}

function extractSkillSection(content: string, label: string): string | undefined {
  const section = matchSectionUntilEnd(content, label);
  if (!section) return undefined;
  return section.replace(`## ${label}`, '').trim();
}

function removeSection(content: string, heading: string): string {
  let r = content.replace(new RegExp(`^## ${heading}[\\s\\S]*?(?=\\n## )`, 'm'), '');
  r = r.replace(new RegExp(`^## ${heading}[\\s\\S]*$`, 'm'), '');
  return r;
}

function replaceSectionWithPlaceholder(
  content: string,
  heading: string,
  placeholder: string,
): string {
  const section = matchSectionUntilEnd(content, heading);
  if (!section) return content;
  return content.replace(section, section.trimEnd() + '\n\n' + placeholder + '\n');
}

function processLessonContent(content: string): string {
  let result = removeSection(content, 'Drill');
  result = replaceSectionWithPlaceholder(
    result,
    'Feynman Explain',
    PERPLEXITY_PLACEHOLDER + 'feynman',
  );
  result = replaceSectionWithPlaceholder(result, 'Reframe', PERPLEXITY_PLACEHOLDER + 'reframe');
  return result;
}

function PerplexityButton({ skillId }: { skillId: string }) {
  const content = useLessonViewStore((s) => s.content);

  const handleClick = async () => {
    const skill = AI_SKILLS.find((s) => s.id === skillId);
    if (!skill) return;
    const hint = content ? extractSkillSection(content, skill.label) : undefined;
    const cleaned = content ? stripContentForAI(content) : '';
    const prompt = skill.buildPrompt(cleaned, hint);
    void copyPrompt(prompt);
  };

  return (
    <button
      onClick={() => void handleClick()}
      className="font-sans inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors bg-gray-800/60 border-gray-600/50 text-gray-400 hover:bg-gray-700 hover:text-gray-200 cursor-pointer"
    >
      Open in Perplexity
      <ExternalLink size={12} />
    </button>
  );
}

interface LessonContentViewerProps {
  search: UseLessonSearchReturn;
  hasNext?: boolean;
  onNextChapter?: () => void;
}

function ClozeBlockquote({ children, ...props }: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) {
  const ref = useRef<HTMLQuoteElement>(null);
  useEffect(() => {
    const bq = ref.current;
    if (!bq) return;
    const btn = bq.querySelector('.cloze-reveal-all-btn');
    if (!btn) return;
    const handler = () => {
      const blanks = bq.querySelectorAll('.cloze-blank-hidden');
      blanks.forEach((el) => (el as HTMLElement).click());
    };
    btn.addEventListener('click', handler);
    return () => btn.removeEventListener('click', handler);
  }, []);
  return (
    <blockquote ref={ref} {...props}>
      {children}
    </blockquote>
  );
}

export default function LessonContentViewer({
  search,
  hasNext,
  onNextChapter,
}: LessonContentViewerProps) {
  const { t } = useTranslation();
  const { course, module } = useCurrentLesson();
  const push = useViewStore((s) => s.push);
  const contentRef = useLessonViewStore((s) => s.contentRef);
  const setMarkdownRef = useLessonViewStore((s) => s.setMarkdownRef);
  const bodyContent = useLessonViewStore((s) => s.bodyContent);
  const [scrollPct, setScrollPct] = useState(0);
  const sections = useLessonViewStore((s) => s.sections);
  const courseId = useLessonViewStore((s) => s.courseId);
  const moduleId = useLessonViewStore((s) => s.moduleId);
  const [hasCumulative, setHasCumulative] = useState(false);

  useEffect(() => {
    if (courseId && moduleId) {
      api.quiz
        .hasCumulative(courseId)
        .then(setHasCumulative)
        .catch(() => {});
    }
  }, [courseId, moduleId]);

  const { contentWidth, fontSize, theme, focusMode } = useSettingsStore(
    useShallow((s) => ({
      contentWidth: s.contentWidth,
      fontSize: s.fontSize,
      theme: s.theme,
      focusMode: s.focusMode,
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

  const handleScroll = () => {
    const el = contentRef.current;
    if (!el) return;
    const id = findVisibleHeading(el, sections);
    useLessonUIStore.getState().setVisibleSection(id);
    const pct =
      el.scrollHeight > el.clientHeight
        ? Math.min(100, Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100))
        : 0;
    setScrollPct(pct);
  };

  const highlights = useHighlightsStore((s) => s.byModule[`${courseId}:${moduleId}`]);
  const markdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setMarkdownRef(markdownRef);
  }, [setMarkdownRef]);

  const displayedContent = processLessonContent(bodyContent);

  const rehypePlugins = [
    rehypeHighlight,
    rehypeCloze,
    [rehypeHighlightText, highlights ?? []],
    ...(search.searchActive && search.searchQuery
      ? [[rehypeSearchText, search.searchQuery, search.caseSensitive]]
      : []),
  ] as PluggableList;

  return (
    <>
      <div className="flex-1 flex flex-col overflow-clip min-h-0">
        <div className="relative h-0.5 bg-gray-700/50 shrink-0">
          <div
            className="absolute top-0 left-0 h-full bg-indigo-500 reading-progress-bar"
            style={{ width: `${scrollPct}%` }}
          />
        </div>
        <div
          className={`flex-1 overflow-y-auto min-h-0${focusMode ? ' hide-scrollbar' : ''}`}
          data-testid="lesson-content"
          ref={contentRef}
          tabIndex={-1}
          onScroll={handleScroll}
        >
          {courseId && <LessonWarmUpBar courseId={courseId} />}
          <div
            className={clsx(
              'px-3 sm:px-6 book-content',
              contentWidth === 'narrow' && 'book-content-narrow',
              contentWidth === 'standard' && 'book-content-standard',
              contentWidth === 'wide' && 'book-content-wide',
              contentWidth === 'full' && 'book-content-full',
            )}
            data-testid="book-content-area"
            style={{ fontSize: `${fontSize}px`, ...themeVars }}
            onMouseUp={handleTextSelectionWithAutoCopy}
          >
            <LessonContentHeader rehypePlugins={rehypePlugins} />
            <div ref={markdownRef} data-markdown-root>
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={rehypePlugins}
                components={{
                  ...lessonComponents,
                  blockquote: ClozeBlockquote,
                  span: ({ className, ...props }) => {
                    if (className?.includes('cloze-blank')) {
                      return (
                        <ClozeBlank
                          answer={(props as Record<string, string>)['data-answer'] || ''}
                        />
                      );
                    }
                    return <span className={className} {...props} />;
                  },
                  p: ({ children }) => {
                    const text =
                      typeof children === 'string'
                        ? children
                        : Array.isArray(children) && typeof children[0] === 'string'
                          ? children[0]
                          : '';
                    if (text.startsWith(PERPLEXITY_PLACEHOLDER)) {
                      return (
                        <PerplexityButton skillId={text.replace(PERPLEXITY_PLACEHOLDER, '')} />
                      );
                    }
                    return <p>{children}</p>;
                  },
                }}
              >
                {displayedContent}
              </ReactMarkdown>
            </div>

            <div style={{ height: '50vh' }} />

            <div className="flex items-center justify-center gap-4 mt-8 font-sans">
              {course && module && (
                <>
                  <div className="flex items-center bg-gray-800/50 border border-gray-700/60 rounded-lg overflow-hidden">
                    <button
                      onClick={() => push({ type: 'quiz', course, module })}
                      className="px-3 py-1.5 text-[11px] font-medium bg-indigo-600/80 text-indigo-100 hover:bg-indigo-500/80 transition-colors"
                    >
                      {t('lesson.quizMCQ', 'Quiz')}
                    </button>
                    {hasCumulative && (
                      <>
                        <div className="h-4 w-px bg-gray-600/50" />
                        <button
                          onClick={() => push({ type: 'cumulativeQuiz', course })}
                          className="px-3 py-1.5 text-[11px] text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
                        >
                          {t('lesson.quizCumulative', 'Cumulative')}
                        </button>
                      </>
                    )}
                  </div>
                  {hasNext && onNextChapter && (
                    <button
                      onClick={onNextChapter}
                      className="px-4 py-2 text-xs font-medium bg-indigo-600/80 text-indigo-100 hover:bg-indigo-500/80 transition-colors rounded-lg"
                    >
                      {t('lesson.completeAndNext', 'Complete & Next →')}
                    </button>
                  )}
                  {!hasNext && <LessonContentCompletionButton />}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <SelectionToolbar />
      <NotePopover />
    </>
  );
}
