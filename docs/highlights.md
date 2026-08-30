# CourseReader Highlight Algorithm — full walkthrough

`AGENTS.md` holds the compact invariants (the gotchas that cause real bugs). This file holds the mechanism for the infrequent occasion you need to trace it. See `AGENTS.md` for the invariant list.

## Two-step offset-based approach

1. **Offset capture at selection time**: `getTextOffset` in `lessonHelpers.tsx` uses `document.createTreeWalker(container, SHOW_TEXT)` to compute plain-text offset of selected range. TreeWalker avoids `range.toString()` which inserts implicit `\n` at block boundaries (paragraphs, headings, lists) — correcting the mismatch between DOM text (with newlines) and hast tree text (no newlines).

2. **Offset application via rehype plugin**: `rehypeHighlightText` (`rehypeHighlightText.ts`) walks hast tree with cumulative `pos` counter. For each text node, highlights overlapping `[startOffset, endOffset)` range are applied by splitting the text node and inserting `<mark>` elements. Single offset pair can span multiple text nodes across inline formatting (bold, italic, code) and block boundaries.

## markdownRef wiring

`lessonViewStore.markdownRef` wired in `LessonContentViewer` via `useEffect`. `SelectionToolbar` and `NoteEditor` both use `markdownRef.current ?? contentRef.current` for offset computation.

## Validation & re-anchoring (drift handling)

Offsets are positional and courses are plain files, so content edits can silently shift every highlight after the edit point. Before applying offsets, `resolveOffsets(fullText, highlights)` in `rehypeHighlightText.ts` validates each highlight:

1. `collectFullText` concatenates all hast text (mirroring the `pos` counter walk — mermaid code excluded, everything else counted).
2. Each highlight's `[startOffset, endOffset)` window is extracted and compared to `selectedText` with whitespace collapsed (`normalizeWithMap` builds a collapsed string plus two-way index maps — DOM selections across block boundaries contain newlines that hast text never has).
3. Match → offsets are valid, applied as-is.
4. Mismatch → re-anchor: search the collapsed text for the selected text, pick the occurrence nearest the original offset, rewrite `startOffset`/`endOffset` from the map. Handles courses edited after highlights were captured.
5. Selected text gone → highlight is dropped from rendering with a `logger.warn` instead of marking the wrong text.

### getTextOffset DOM filters

The capture TreeWalker rejects text inside `svg` subtrees (mermaid diagram labels rendered client-side) and `[data-code-copy]` (the code-block copy button's "Copy"/"Copied" label). Both are DOM-only with no hast counterpart — without the filters every highlight after a code block or diagram would capture shifted offsets.

### Section-scoped capture

`SelectionToolbar.handleAddHighlight` stamps `sectionID` onto the new highlight via `findSectionIdForRange` (`studyTools/notesHelpers.ts`), walking up from the range's start container to the nearest preceding heading. `HighlightItem` prefers the stored sectionID and only falls back to the legacy DOM walk (`findSectionIdForHighlight`) for legacy rows.
