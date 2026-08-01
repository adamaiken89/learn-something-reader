# CourseReader Highlight Algorithm — full walkthrough

`AGENTS.md` holds the compact invariants (the gotchas that cause real bugs). This file holds the mechanism for the infrequent occasion you need to trace it. See `AGENTS.md` for the invariant list.

## Two-step offset-based approach

1. **Offset capture at selection time**: `getTextOffset` in `lessonHelpers.tsx` uses `document.createTreeWalker(container, SHOW_TEXT)` to compute plain-text offset of selected range. TreeWalker avoids `range.toString()` which inserts implicit `\n` at block boundaries (paragraphs, headings, lists) — correcting the mismatch between DOM text (with newlines) and hast tree text (no newlines).

2. **Offset application via rehype plugin**: `rehypeHighlightText` (`rehypeHighlightText.ts`) walks hast tree with cumulative `pos` counter. For each text node, highlights overlapping `[startOffset, endOffset)` range are applied by splitting the text node and inserting `<mark>` elements. Single offset pair can span multiple text nodes across inline formatting (bold, italic, code) and block boundaries.

## markdownRef wiring

`lessonViewStore.markdownRef` wired in `LessonContentViewer` via `useEffect`. `SelectionToolbar` and `NoteEditor` both use `markdownRef.current ?? contentRef.current` for offset computation.
