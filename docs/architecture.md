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
│   ├── hooks/            # 22+ domain hooks (useLesson, useBookmarks, useHighlights, useQuizEngine, useReviewState, useCardReviewState, useLessonNav, useLessonSearch, useLessonSection, useLessonAnimations, useLessonKeyboardShortcuts, useNotes, useSelection, useShortcuts, useSettingsPage, useDashboard, useWheelNavigation, useSearchOverlay, useCurrentLesson, useAppInit, useAutoCopy, useCountUp, useClipboardFallback, etc.)
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

Full-view overlay uses CSS `transform: translate(panX, panY) scale(zoom)` with `overflow-hidden` container. Drag to pan (window-level mousemove/mouseup). Wheel zooms toward cursor. Zoom buttons adjust toward center anchor (`applyZoomWithCenterAnchor`). Initial home from `computeHome` — fit-to-viewport with legibility boost (`LEGIBLE_PX/minFontSize`), clamped 0.5x–2x. Limits: 0.5x – 5x. No animation (instant transform). Download PNG button unchanged.

Inline diagrams are **crop-to-content normalized**: `parseSvgSize` returns the full viewBox rect `{x, y, w, h}` (mermaid mindmaps use negative origins); the layout effect measures the rendered SVG via `getBBox()` (falling back to the viewBox rect when unavailable — happy-dom has no `getBBox`), then positions the SVG inside a `position: relative` wrapper (explicit `width × height` = tight content dims) via an absolutely-positioned frame offset by `viewBox.origin − bbox.origin`. This guarantees painted content always starts at `(0,0)` of the scaled box — CSS scrollable overflow only extends right/down, so negative-coordinate content would otherwise clip at the left/top edges unscrollable. Offsets live in React state (`dims`), never imperative svg style mutation: happy-dom + React 19 recreate `dangerouslySetInnerHTML` children on every re-render, wiping imperative styles.

Inline home from `computeWidthHome` — never shrinks below natural size (min zoom 1), fills container **width** when narrower, legibility boost (`LEGIBLE_PX/minFontSize`), cap `INLINE_MAX_ZOOM` (3); `pan.x = max(0, (availW − w·z)/2)`, `pan.y = 0` (normalization handles vertical). Wide diagrams overflow via native horizontal scroll (`overflow-x-auto`; wheel handler passes `deltaX` through). Container height tracks zoom (`boxH = content.h * zoom`) so scaled-up diagrams reserve layout space instead of overlapping prose; manual zoom/wheel/reset update it via `applyView`. Inline zoom controls hidden by default — hover toolbar has a toggle (`mermaid-controls-toggle`, ZoomIn icon, `aria-pressed`); when on, shows +/pct/−/1:1 buttons and enables wheel zoom. Fullscreen button always visible.
