# CourseReader Architecture — detailed module map

`AGENTS.md` holds conventions and gotchas; this file holds the full structural map for the infrequent occasion you need it. See `AGENTS.md` for the dir-level view.

## Full source tree

```
src/
├── mainview/             # React frontend (Vite, root=src/mainview)
│   ├── main.tsx          # React entry point
│   ├── App.tsx           # View stack router
│   ├── rpc.ts            # Electrobun RPC client
│   ├── api.ts            # API helpers (wraps rpc.ts)
│   ├── index.css         # Tailwind + book prose styles
│   ├── colors.ts         # Color utilities
│   ├── themes.ts         # Theme definitions (18 themes)
│   ├── logger.ts         # Frontend logger
│   ├── toast.ts          # Toast notifications
│   ├── shortcuts.ts      # Keyboard shortcuts (single source of truth)
│   ├── i18n.ts           # Internationalization setup
│   ├── layouts/          # PageLayout, PageHeader, PageContent
│   ├── pages/            # 7 pages: Dashboard, Lesson, Quiz, Review, UserCardReview, Settings, Bookmarks
│   ├── sections/         # Complex content: Lesson, Quiz, Review, UserCardReview
│   ├── components/       # Leaf-level reusable UI. No routing awareness.
│   │   ├── lesson/       # LessonToolbar, NavigationPanel, SelectionToolbar, NoteEditor, CardEditor, ColorPickerRow, NotePopover, ViewerSearch
│   │   ├── quiz/         # QuizProgressBar, QuizMCQGrid, QuizClozeInput, QuizExplanation, QuizBottomNav
│   │   ├── study-tools/  # NotesHighlightsTab, BookmarksTab, CardsTab, AITab
│   │   ├── ui/           # Button, StatCard
│   │   └── ...           # CourseSwitcher, ErrorBoundary, MermaidDiagram, MermaidOverlay, SearchOverlay, StudyTools, PomodoroTimer
│   ├── ai/               # AI skill configs, prompt builders, clipboard utils
│   │   ├── skills.ts     # AI_SKILLS definitions + prompt builders
│   │   └── utils.ts      # copyPrompt(): clipboard + toast + open browser
│   ├── hooks/            # 22+ domain hooks (useLesson, useBookmarks, useHighlights, useQuizEngine, useReviewState, useCardReviewState, useLessonNav, useLessonSearch, useLessonSection, useLessonAnimations, useLessonKeyboardShortcuts, useNotes, useSelection, useShortcuts, useSettingsPage, useDashboard, useWheelNavigation, useSearchOverlay, useCurrentLesson, useAppInit, useAutoCopy, useCountUp, useEditableFieldShortcuts, etc.)
│   └── stores/           # Zustand (13): viewStore, lessonViewStore, courseStore, settingsStore, pomodoroStore, bookmarksStore, completionStore, highlightsStore, lessonUIStore, notesStore, syncStore, selectionStore, quizStore
├── types/                # Ambient declarations (three, jest-dom)
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
    ├── logger.ts         # Backend logger
    ├── utils.ts          # Utility functions
    └── yaml.ts           # YAML parsing utilities
```

## Mermaid zoom/pan overlay

Full-view overlay uses CSS `transform: translate(panX, panY) scale(zoom)` with `overflow-hidden` container. Drag to pan (window-level mousemove/mouseup). Wheel zooms toward cursor. Zoom buttons adjust toward center anchor (`applyZoomWithCenterAnchor`). Initial home from `computeHome` — fit-to-viewport capped at 1 (100% default, never magnifies; the old legibility boost auto-expanded small-font diagrams), clamped 0.5x–2x. Re-fits on box resize via a container ResizeObserver (`rehome` useEffectEvent) so a window resize while open doesn't leave stale zoom/pan. Limits: 0.5x – 5x. No animation (instant transform). Download PNG button unchanged.

Inline diagrams are **crop-to-content normalized**: `parseSvgSize` returns the full viewBox rect `{x, y, w, h}` (mermaid mindmaps use negative origins). Layout box = viewBox rect exactly; in browsers a `getBBox()` measurement shifts an absolutely-positioned frame by `viewBox.origin − bbox.origin` so painted content starts at `(0,0)` (happy-dom has no `getBBox` → offsets 0). The SVG is stretched to fill its frame via scoped CSS (`.mermaid-inline svg { width/height: 100% !important }`) — visual box == layout box, so centering math and reserved height are exact. CSS scrollable overflow only extends right/down; without normalization negative-coordinate content clips at left/top unscrollably. Offsets live in React state (`dims`), never imperative svg style mutation: happy-dom + React 19 recreate `dangerouslySetInnerHTML` children on every re-render, wiping imperative styles. Inline container overrides the shared flex-centering with `justify-content: flex-start` — centering is owned by `pan.x` (flex-center + overflowing child would clip the left edge unscrollably).

Inline home from `computeWidthHome(viewportW, content)`: `zoom = min(1, availW/w)` — **100% default**: diagrams that fit the column render at exactly 1:1 (the old legibility floor/ceiling auto-expanded small-font diagrams to ~132–140% — removed); diagrams wider than the column shrink to fit width and scroll horizontally via native `overflow-x-auto` (wheel handler passes `deltaX` through). `pan.x = max(0, (availW − w·z)/2)`, `pan.y = 0`. Container height = diagram height × `min(zoom, 1)` (clamped in `applyView`, single choke point shared by effect/zoom/wheel/reset): at 100% the box is the diagram's full natural height — height depends on the diagram, no fixed cap; manual zoom-in keeps the box at natural height and scrolls internally so the page layout stays undisturbed. Home re-computes on size changes: effect body extracted into a `useEffectEvent` (`rehome`) called by both the `[svg]` effect and a width-gated `ResizeObserver` on the container (content-width setting changes resize the container → responsive re-fit; RO skips self-inflicted boxH changes via `lastRoWRef` so wheel-zoom isn't reset; RO firing untestable under happy-dom). The RO effect keys on `[svg]` — before the svg renders the loading branch leaves `containerRef` null, so `[]` deps would leave the RO permanently unattached (this shipped once: content-width switch kept stale `pan.x` = big left gap). Inline zoom controls hidden by default — hover toolbar has a toggle (`mermaid-controls-toggle`, ZoomIn icon, `aria-pressed`); when on, shows +/pct/−/1:1 buttons and enables wheel zoom. Auto-fit: `mermaid-fit` button (visible with zoom controls) calls `computeFitHome` — shrinks the whole diagram to `FIT_VIEW_RATIO` (0.8) of the box, centered, floor 0.2. Fullscreen button always visible.
