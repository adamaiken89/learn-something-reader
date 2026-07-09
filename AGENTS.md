# CourseReader — desktop study app (Electrobun + React)

## Architecture

React 19 + TypeScript frontend, Bun backend, packaged as desktop app via Electrobun.

```
src/
├── mainview/             # React frontend (Vite, root=src/mainview)
│   ├── main.tsx          # React entry point
│   ├── App.tsx           # View stack router
│   ├── rpc.ts            # Electrobun RPC client
│   ├── api.ts            # API helpers (wraps rpc.ts)
│   ├── index.css         # Tailwind + book prose styles
│   ├── colors.ts         # Color utilities
│   ├── themes.ts         # Theme definitions (12 themes)
│   ├── logger.ts         # Frontend logger
│   ├── toast.ts          # Toast notifications
│   ├── shortcuts.ts      # Keyboard shortcuts (single source of truth)
│   ├── i18n.ts           # Internationalization setup
│   ├── layouts/          # PageLayout, PageHeader, PageContent
│   ├── pages/            # 7 pages: Dashboard, Lesson, Quiz, Review, UserCardReview, Settings, Bookmarks
│   ├── sections/         # Complex content: Lesson, Quiz, Review, UserCardReview
│   ├── components/       # Leaf-level reusable UI. No routing awareness.
│   │   ├── lesson/       # LessonToolbar, NavigationPanel, SelectionToolbar, NoteEditor, CardEditor, ColorPickerRow, NotePopover, ViewerSearch
│   │   ├── study-tools/  # NotesHighlightsTab, BookmarksTab, CardsTab, AITab
│   │   ├── ui/           # Button, StatCard
│   │   └── ...           # CourseSwitcher, ErrorBoundary, MermaidDiagram, SearchOverlay, StudyTools, PomodoroTimer
│   ├── hooks/            # useBookmarks, useHighlights, useLesson, useQuizEngine, useReviewState, useCardReviewState, useLessonNav, useLessonSearch, useNotes, useSelection, useShortcuts, useCourseListPage, useLessonSection, useSettingsPage
│   └── stores/           # Zustand: viewStore, courseStore, settingsStore, pomodoroStore, bookmarksStore, completionStore, highlightsStore, lessonUIStore, notesStore, syncStore
├── types/                # Ambient declarations (js-yaml, three, jest-dom)
└── bun/                  # Backend (Electrobun RPC handlers)
    ├── index.ts          # RPC router + all handlers
    ├── rpc-schema.ts     # RPC type definitions
    ├── types.ts          # Shared types
    ├── course-loader.ts  # File I/O: subjects, lessons, quizzes; YAML parse
    ├── lesson-markdown.ts # Lesson markdown processing
    ├── search.ts         # Search functionality
    ├── stats.ts          # Statistics computation
    ├── sync.ts           # Sync operations
    ├── srs.ts            # SM-2 filter helpers
    ├── storage.ts        # JSON persistence (~/.coursereader/data.json)
    ├── gemini.ts         # Gemini API client
    ├── logger.ts         # Backend logger
    ├── utils.ts          # Utility functions
    └── yaml.ts           # YAML parsing utilities
```

## Key conventions

- **Frontend → RPC → Backend handlers**. No direct file I/O from UI. Communication via `BrowserView.defineRPC()` — no HTTP server, no open ports.
- **Navigation**: React state-driven view stack. No React Router. Page transitions (flip/slide/fade/none) on LessonPage.
- **Pages**: use `PageLayout` + `PageHeader` + `PageContent`. No inline wrappers.
- **State management**: Zustand stores (cross-cutting), domain hooks (page-specific), useReducer (state machines), local useState (trivial UI only).
- **Store isolation**: Stores must never import other stores. Cross-store orchestration lives in custom hooks (`hooks/useCourseListPage`, `hooks/useLessonSection`, `hooks/useSettingsPage`). Hooks compose multiple stores internally; consumers call one hook instead of 2-4 stores inline. Individual store selectors remain atomic (each `useXxxStore((s) => s.field)` triggers re-render only on that field).
- **Subcomponents** receive data via props, never fetch directly.
- **Markdown**: react-markdown + remarkGfm + rehypeHighlight (highlight.js). Mermaid diagrams rendered via `MermaidDiagram` component.
- **Styling**: Tailwind + `.book-content` CSS (via CSS custom properties).
- **TypeScript strict mode**.
- **i18n first**: all text/emoji/icons via `t('key')`. Locale files at `src/mainview/locales/*.json`. Adding UI text requires keys in all 5 locales + snapshot update.
- **Keyboard shortcuts**: single source of truth at `src/mainview/shortcuts.ts`. All shortcut key/ID/scope defined there. Components import `shortcutKey(id)` for display use. Handlers kept in components (switch statements) — scope overlap intentional where same key does same action in different scopes. Adding new shortcut requires entry in `shortcuts.ts` + handler in component. Duplicate detection runs at module load.

## Course data model

Subjects in `.coursereader/subjects/<dir>/` (dev: `src/subjects/`). Dir name → `Subject.id`. Each subject:

- `syllabus.yaml`
- `modules/<NN-name>/lesson.md`
- `modules/<NN-name>/quiz.yaml`
- `srs/deck.json` (FSRS-5 SRS)

Module dir matching: `findModuleDir` scans `modules/<id>/` for `NN-` prefix.

Subjects path resolution (`src/bun/utils.ts` `findSubjectsDir`):
1. `src/bun/subjects/` (dev, adjacent to source)
2. `src/subjects/` (dev, one level up)
3. `~/.coursereader/subjects/` (production fallback)

## Data persistence

- Subjects/lessons/quizzes: file I/O from `.coursereader/subjects/` tree
- SRS decks: `.coursereader/subjects/<id>/srs/deck.json`
- Highlights, notes, bookmarks, user cards, completion: `~/.coursereader/data.json`
- Gemini API key: `~/.coursereader/prefs.json`
- Logs: `~/.coursereader/logs/<YYYY-MM-DD>.log`

## Scroll layout invariant

`PageContent` (`src/mainview/layouts/PageContent.tsx`) MUST have `flex flex-col` classes. Without them, `div.flex.flex-1.overflow-hidden` inside `LessonSection` gets unbounded height → inner `contentRef` (`overflow-y-auto`) never overflows → `scrollToSection` on `contentRef.scrollTop` silently does nothing.

The real scrollbar lives on `contentRef` only when `PageContent` is a flex container. If `contentRef` has `overflow-y-auto` but sections are always at scrollTop 0, check `PageContent` hasn't lost `flex flex-col`.

## Quirks

- `vite.config.ts` root=`src/mainview`, output=`dist/`
- `index.css`: Tailwind directives + `.book-content` + highlight.js styles
- **Desktop-only app** (Electrobun). All I/O local. Skip lazy loading, code splitting, chunking, network optimizations. Import eagerly. Bundle once. `vite.config.ts` `rollupOptions.output.codeSplitting: false` intentional (no chunks needed).
- **Selection overlays**: `LessonSelectionOverlays` (selection toolbar, note/card editors) appear when text selected in content viewer. Driven by `selectionchange` listener in `useSelection` + `onMouseUp` on `LessonContentViewer`.
- **In-page search**: `useLessonSearch` effect scans `mark[data-search-match]` in DOM. Dep array MUST include `caseSensitive` — toggling case re-runs rehype (new marks) but effect won't recalculate match count without it.
- **E2E mock RPC**: `mockRPC.ts` uses `Proxy` + handler table. Unknown methods `reject` (not silent null). Add new RPC handler key when backend adds handler.

## Test conventions

- **NO `mock.module` in test files**. All external lib mocks in `src/setup.tsx` (sonner, react-markdown, child_process, fs, mermaid, electrobun). Internal modules: use `spyOn` on `import * as NS` (refactor prod code if needed) or rely on real impl + store state control.
- **`mock.restore()` DESTROYS setup.tsx's global mocks**. Never call `mock.restore()` in individual test files — it undoes sonner/react-markdown/child_process/fs/mermaid/electrobun mocks process-wide.
- **Page/test files must call `setupRPC()`** at module level. Without it, RPC handler defaults to `Promise.resolve(null)` (works only if another test file happened to call it first — fragile ordering dependence).
- **Store state pollution across test files**: zustand stores persist in-memory. `localStorage.clear()` in setup.tsx afterEach prevents persistent state leakage. Some tests need explicit `useXxxStore.setState({ ... })` in beforeEach.
- **E2E tests excluded from bun**: `e2e/tests/` Playwright tests crash under `bun test` (Playwright `test.describe` not a bun API). Exclude via `package.json` `test` script or bun config.
- **UI tests via e2e**: Component/interaction tests impractical with bun + jsdom (Electrobun `BrowserView`, DOM measurement, scroll behavior, selection overlays all platform-specific). Use Playwright e2e tests for UI validation instead. Prefer at module level — page snapshots catch most regressions cheaply. Reach for e2e when testing: scroll-to-section, selection toolbar positioning, popover/overlay placement, keyboard shortcut dispatch, search highlight matching, page transitions.
