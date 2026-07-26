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
    ├── logger.ts         # Backend logger
    ├── utils.ts          # Utility functions
    └── yaml.ts           # YAML parsing utilities
```

## Key conventions

- **Frontend → RPC → Backend handlers**. No direct file I/O from UI. Communication via `BrowserView.defineRPC()` — no HTTP server, no open ports.
- **Navigation**: React state-driven view stack. No React Router. Page transitions (flip/slide/fade/none) on LessonPage.
- **Pages**: use `PageLayout` + `PageHeader` + `PageContent`. No inline wrappers.
- **State management**: Zustand stores (cross-cutting), domain hooks (page-specific), useReducer (state machines), local useState (trivial UI only).
  - **Props vs store**: Default to props for direct parent→child data flow. Use Zustand when: (a) 3+ siblings read same state, (b) deeply nested children need access, or (c) parent reads store and passes 1:1 to child (store-internal pattern). Session-local state (quiz, review) can use either — pick whichever reduces boilerplate for the specific case.
- **Store isolation**: Stores must never import other stores. Cross-store orchestration lives in custom hooks (`hooks/useLessonSection`, `hooks/useSettingsPage`). Hooks compose multiple stores internally; consumers call one hook instead of 2-4 stores inline. Individual store selectors remain atomic (each `useXxxStore((s) => s.field)` triggers re-render only on that field).
- **Subcomponents** receive data via props, never fetch directly.
- **Store-internal components**: if a component consumes store values that its parent already reads and passes as props (1:1 mapping), the child should read the store directly and drop the prop. Example: `NavigationPanel` reads `rightPanel`/`setRightPanel` from `settingsStore` directly instead of receiving `activeTab`/`onTabChange` + `onClose` props.
- **Markdown**: react-markdown + remarkGfm + rehypeHighlight (highlight.js). Mermaid diagrams rendered via `MermaidDiagram` component.
- **Styling**: Tailwind + `.book-content` CSS (via CSS custom properties).
- **TypeScript strict mode**.
- **AGENTS.md live**: update AGENTS.md during every feature dev. New hooks, stores, pages, conventions, quirks, invariants get documented immediately. Treat AGENTS.md as living memory — next agent reads it first.
- **i18n first**: all text via `t('key')`. Locale files at `src/mainview/locales/*.json`. Adding UI text requires keys in all 5 locales + snapshot update.
- **Icons via lucide-react**: never emoji in locale strings. Import lucide components directly. Theme icons (`themes.ts` `THEME_ICONS` + locale `icons.*` emoji) are legacy — migrate to lucide when touched.
- **Keyboard shortcuts**: single source of truth at `src/mainview/shortcuts.ts`. All shortcut key/ID/scope defined there. Components import `shortcutKey(id)` for display use. Handlers kept in components (switch statements) — scope overlap intentional where same key does same action in different scopes. Adding new shortcut requires entry in `shortcuts.ts` + handler in component. Duplicate detection runs at module load.
- **Effect cleanup**: Use `useEffectEvent` (React 19) for event listener effects that reference reactive values. Extracts handler into stable callback, effect registers listener once. Pattern: `const onKey = useEffectEvent((e: KeyboardEvent) => { /* uses state */ }); useEffect(() => { window.addEventListener('keydown', onKey); }, []);`. Eliminates listener re-registration when callback identity changes. Applied in: QuizSection, ClozeQuizSection, CumulativeQuizSection, useQuizKeyboard, ReviewSection, SettingsPage, BottomSheet, MermaidOverlay, useNotePopoverOnClick.
- **React Compiler (auto-memo)**: `babel-plugin-react-compiler` v1.0.0 active via `vite.config.ts` `reactCompilerPreset()`. Compiler auto-memoizes values + components at build time. Manual `useMemo`/`useCallback` is redundant — compiler handles it. These hooks are removed from codebase. Exception: keep `useMemo` only for genuinely expensive computations (>1ms) verified by profiling, but none known currently. `eslint-plugin-react-compiler` set to `error` to prevent reintroduction.

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
- Gemini API key: `~/.coursereader/prefs.json` _(legacy — Tier 1 AI uses clipboard+browser, no key needed)_
- Logs: `~/.coursereader/logs/<YYYY-MM-DD>.log`

## Scroll layout invariant

`PageContent` (`src/mainview/layouts/PageContent.tsx`) MUST have `flex flex-col` classes. Without them, `div.flex.flex-1.overflow-hidden` inside `LessonSection` gets unbounded height → inner `contentRef` (`overflow-y-auto`) never overflows → `scrollToSection` on `contentRef.scrollTop` silently does nothing.

The real scrollbar lives on `contentRef` only when `PageContent` is a flex container. If `contentRef` has `overflow-y-auto` but sections are always at scrollTop 0, check `PageContent` hasn't lost `flex flex-col`.

## Search

Two levels:
- **Global search** (`SearchOverlay`): ⌘K, debounced 300ms, searches all lessons/notes/highlights, course filter chips, grouped results, section-level scroll-to on navigate
- **Within-lesson search** (`ViewerSearch`): scoped to current lesson, match count, prev/next navigation, search highlighting via rehype plugin. `useLessonSearch` effect scans `mark[data-search-match]` in DOM — dep array MUST include `caseSensitive` (toggling case re-runs rehype but effect won't recalculate match count without it).

## Page Transitions

LessonPage supports 4 styles: none, flip, slide, fade. Stored in `settingsStore.transitionStyle`. CSS transforms only (no animation library). `useLessonNav` tracks direction for slide animation orientation.

## Quirks

- `vite.config.ts` root=`src/mainview`, output=`dist/`
- `index.css`: Tailwind directives + `.book-content` + highlight.js styles
- **Desktop-only app** (Electrobun). All I/O local. Skip lazy loading, code splitting, chunking, network optimizations. Import eagerly. Bundle once. `vite.config.ts` `rollupOptions.output.codeSplitting: false` intentional (no chunks needed).
- **Selection overlays**: `LessonSelectionOverlays` (selection toolbar, note/card editors) appear when text selected in content viewer. Driven by `selectionchange` listener in `useSelection` + `onMouseUp` on `LessonContentViewer`.
- **Mermaid zoom/pan overlay**: Full-view overlay uses CSS `transform: translate(panX, panY) scale(zoom)` with `overflow-hidden` container. Drag to pan (window-level mousemove/mouseup). Wheel zooms toward cursor. Zoom buttons adjust toward center anchor (`applyZoomWithCenterAnchor`). Auto-fit sets initial zoom to `Math.max(1, containerWidth/svgWidth)` — never below 100%. Limits: 0.5x – 5x. No animation (instant transform). Download PNG button unchanged.
- **E2E mock RPC**: `mockRPC.ts` uses `Proxy` + handler table. Unknown methods `reject` (not silent null). Add new RPC handler key when backend adds handler.
- **TS7 dual setup**: `typescript@6.0.2` (JS API for eslint/typescript-eslint) + `@typescript/native@npm:typescript@^7.0.2` (Go `tsc` binary). Install TS6 first so `.bin/tsc` links to TS7. `tsconfig.json` needs `"types": ["*"]` (TS7 default is `[]`). Bun alias resolution differs from node — use direct installs, not `@typescript/old`.

## Button styling conventions

- **`Button` component** (`src/mainview/components/ui/Button.tsx`): base shadow via `shadow-sm`, hover: `shadow-md` + `-translate-y-0.5`, transition `transition-all duration-150`. `variant` controls bg/border/text colors (primary=indigo, outline=border, ghost=transparent).
- **Toolbar buttons** (lesson toolbar, search, zoom, etc.): `shadow-none` (override Button's `shadow-sm`), `hover:bg-gray-700/30` subtle background instead of lift.
- **StatsBar**: `StatCard` counts animate via `useCountUp` hook. Test assertions on stats must avoid relying on exact animated value — check for surrounding text like `/10` instead of `4/10`.

## Clipboard fallback

`useClipboardFallback` (mounted in `App.tsx`) listens for window-level `copy`/`cut` events. When `clipboard-write` permission unavailable (Electrobun), uses `document.execCommand('copy')` fallback. Also overrides Ctrl+A in lesson content viewer to select all text in `contentRef`.

## AI Integration

Two tiers: clipboard-forwarding (no setup) vs deep API (Gemini key).

### Tier 1: Clipboard + Browser (default, no API key)

Opens Perplexity (`perplexity.ai/search?q=`). Stable URL, intended search API. Previously used Google AI Mode (`udm=50` undocumented param) — migrated to Perplexity for reliability.

Why clipboard+browser over in-app chat:
- Zero friction (no API key, no account linking)
- User brings own AI (ChatGPT/Claude/Gemini/Perplexity — paste anywhere)
- No credential storage, no backend AI costs

Costs accepted:
- Output silo (AI answers never auto-save to notes/highlights)
- 4-step UX chain: click → copy → switch tab → paste
- No measurement/analytics for v1 (`logSession` type union doesn't include `'ai_skill'`)

### Privacy

Consent required before first clipboard copy. `settingsStore.aiShareConsent` (localStorage `coursereader-ai-consent`, default false). First click shows confirm dialog. Subsequent clicks skip.

### Interaction design — single-turn output generators

All 3 skills are single-turn output generators (not dialogues). Clip-browser delivery cannot sustain multi-turn — AI response lands in browser tab app cannot control.

| Skill | AI persona | Output |
|-------|-----------|--------|
| Feynman Explain | Curious 12-year-old | Prompt instructs user to type explanation above pre-filled text, then send. AI asks 3-5 clarifying questions. Single-message Feynman workaround for chat UI. |
| Reframe | Socratic coach | Alternative reframe + strength/weakness analysis (3 sections) |
| Drill | Quizmaster | 5 practice questions (2 recall, 2 application, 1 analysis) |

Each builds: `[concise persona + output format] + [hint from lesson section] + [full lesson content]`. Calls `copyPrompt()`. No "First, say..." preamble — output is the deliverable.

### Lesson content section handling (AI skill sections)

Lesson markdown can include `## Feynman Explain`, `## Reframe`, `## Drill` headings with seed analogy/framing for AI prompts.

**Lesson viewer** (`LessonContentViewer.tsx`): `processLessonContent()` pre-processes `bodyContent` before ReactMarkdown render.
- `## Drill` section — removed entirely (hidden from viewer)
- `## Feynman Explain` / `## Reframe` — section content replaced with "Open in Perplexity" button (`PerplexityButton` component). Click builds prompt via `AI_SKILLS.buildPrompt()` + `extractSkillSection()` hint, then calls `copyPrompt()` (clipboard + Perplexity open).

**AI tab** (`NavigationAITab.tsx`): parses lesson content for hint extraction, passed to `buildPrompt(context, hint?)`. If section missing, hint undefined (falls back to content-only prompt). Drill button hidden from skill list. Feynman/Reframe buttons show `ExternalLink` icon.

`extractSkillSection(content, label)` function (duplicated in both files): uses regex `/^## <label>[\s\S]*?(?=^## |\z)/m` to extract hint text between the heading and next section. `processLessonContent()` uses same pattern for removal/replacement.

### System browser (Utils.openExternal)

`copyPrompt()` (`ai/utils.ts`) copies prompt to clipboard, opens Perplexity in system browser via RPC (`api.shell.openExternal`). Backend calls `Utils.openExternal(url)` from `electrobun/bun`. Prompt appended as `?q=` URL param (sliced 6000 chars) for auto-fill. Full prompt on clipboard for long prompts. 6000 avoids HTTP 431 from URL + header size exceeding server/proxy limits.

### Happy-dom event propagation limitation

`setup.tsx:128-130` uses happy-dom `Window`. happy-dom NOT reliably bubble `KeyboardEvent` from `document.body` → `window`. Affects all `window.addEventListener('keydown', handler)` tests.

**Fix**: Use `pressKey(key)` from `testUtils.ts` instead of `user.keyboard('{Key}')`. `pressKey` dispatches directly on `window` via `window.dispatchEvent(new KeyboardEvent(...))` wrapped in `act`. Bypasses bubbling issue.

Use `user.keyboard()` only for tests needing focus management. For raw `window.addEventListener` dispatch, `pressKey()` is more reliable.

### Pedagogical notes

- **Feynman text vs speech**: Text-Feynman loses oral feedback loop. Acceptable because: forces precise written explanation, AI can quote exact passages back, many users study in public. Research basis: Fiorella & Mayer (2015) — written explanatory still > restudy.
- **Drill vs built-in quiz/SRS**: Differentiator is dynamic adaptation. Quiz is static pre-authored questions. AI drill generates novel synthesis questions. Single-turn limitation means questions generated upfront with answers — user self-tests.
- **Scope ceiling**: Clipboard approach self-limits — cannot auto-inject AI output into app (notes, highlights, cards). Write-back requires Tier 2 (API key + in-app chat). Two tiers coexist in same AITab: clipboard by default, deep integration when user provides key.

### Prompt maintenance

Prompts in `ai/skills.ts` are English-only (AI persona instructions stay English regardless of user locale). UI labels use existing i18n. Prompts may degrade as AI models change — single file to update. Prompts trimmed to 50-80 words instruction + hint slot + lesson content. Each skill self-contained (no shared instructions).

## Animations & timing

- **`useCountUp`** (`src/mainview/hooks/useCountUp.ts`): animated number counter using `setTimeout` loop (16ms intervals). Cubic ease-out. Avoid `requestAnimationFrame` — setup.tsx mocks RAF as `cb(0); return 0` (fires synchronously, `performance.now()` static), which causes infinite recursion.
## Lesson → Quiz user flow
- Lesson bottom: "Mark as Complete" (left) + "Cloze Drill" (outline) + "Go to Quiz" (primary, right), centered in flex row. Navigates `push({ type: 'quiz', course, module })`. If module ID matches a cumulative quiz milestone (source_modules suffix), also shows "Cumulative Review" outline button.
- Quiz completion: "Next Chapter →" (if not last module) or "Back to Dashboard" (if last module). Navigates `push({ type: 'lesson', course, module: nextModule })`
- No auto-redirect. User clicks buttons.

## Quiz types (3)

| Type | Data file | Page | Section | View type |
|------|-----------|------|---------|-----------|
| Module MCQ | `modules/N/quiz.yaml` (yaml sequence) | QuizPage | QuizSection | `quiz` |
| Module cloze | `modules/N/cloze.yaml` (yaml sequence, `text` field with `{term}` markers) | ClozeQuizPage | ClozeQuizSection | `clozeQuiz` |
| Cumulative | `cumulative_quiz.yaml` (hybrid: `source_modules: [N]` mapping + sequence) | CumulativeQuizPage | CumulativeQuizSection | `cumulativeQuiz` |

### Quiz page headers

All study pages (QuizPage, ClozeQuizPage, CumulativeQuizPage, ReviewPage) use shared `QuizHeader` (`components/QuizHeader.tsx`): wraps `PageHeader` with `onBack` + CourseSwitcher centered + optional `title` (left slot, after back divider). `title` shows module/course name + quiz type via i18n. Keys: `lesson.clozeQuiz` ("Cloze Drill"), `lesson.cumulativeQuiz` ("Cumulative Review"), `common.quiz` — NOTE these live in the **lesson** block, NOT `quiz.*` (quiz block only has engine strings like loadingQuiz/noQuestions). CumulativeQuizPage appends `displayLabel(id)` range suffix ` (01–03)` parsed from `cumulative_quiz_NN-NN.yaml`. Page tests mounting QuizHeader must `mockResponse('coursesList', [])` (CourseSwitcher fetches course list; mockRPC rejects unmocked methods).

### Quiz section architecture

- **QuizSection** (`sections/QuizSection.tsx`): Full quiz with MCQ grid + cloze input. Uses `useQuizEngine()` (default loader → `api.quiz.start()`).
- **ClozeQuizSection** (`sections/ClozeQuizSection.tsx`): Cloze-only drag-and-drop. Manages own state (no `useQuizEngine` — dnd-kit flow differs from MCQ engine). Drag tokens into `{term}` blanks; wrong drop flashes red, only correct drops fill.
- **CumulativeQuizSection** (`sections/CumulativeQuizSection.tsx`): Mixed MCQ + cloze + TF. Uses `useQuizEngine(courseId, quizId, loader)` with custom loader → `api.quiz.cumulative()`.
- **All three** share `QuizCompletionView` for post-quiz summary (confetti, SVG score ring, filter tabs, review cards).
- **TF questions**: parser auto-fills `options: { True: 'True', False: 'False' }` when type=`tf` and options empty. Rendered as 2-button MCQ grid.
- **Cloze scoring**: `cloze.yaml` `answer` field holds only FIRST `{term}`; multi-blank questions need all terms. `ClozeQuizSection` exports `clozeAnswers(q)` (parses all `{term}`s from question text, falls back to `[q.answer]`) and `clozeCorrect(q, ua)` (compares against comma-joined parsed answers). Stored user answer is comma-joined full blank set — NEVER compare cloze against `q.answer` alone or multi-blank questions score wrong.

### useQuizEngine custom loader

`useQuizEngine(courseId, moduleId, loader?)` accepts optional `(courseId, moduleId) => Promise<QuizQuestion[]>` as third arg. When omitted, defaults to `api.quiz.start`. Stored in `useRef` to avoid re-fetch on identity change. Example:

```typescript
const loader = useCallback(
  (id, qId) => api.quiz.cumulative(id, qId || undefined).then(r => r.questions),
  [],
);
const { status, questions, score, ... } = useQuizEngine(course.id, quizId, loader);
```

### Cumulative quiz format

Two formats exist in the wild:
1. **Pure YAML sequence** (`- id: ...` at top level) — parses to array directly. (equity-trading, llm-moe-cot, learning-methods-deep)
2. **Hybrid mapping** (`source_modules: [..]` then `questions:` key with nested list) — custom `yaml.ts` parser returns a mapping object. (llm-basics)

`parseCumulativeQuiz()` (`courseLoader.ts`) handles BOTH: if parse result is an array → map questions; if it's an object with `questions` array → map those; else empty. Do NOT assume one format — `!Array.isArray(raw) → empty` silently killed hybrid courses.

### Default quiz resolution

`loadCumulativeQuiz(courseId, id?)` — when `id` omitted (LessonContentViewer/SyllabusPage push `{type:'cumulativeQuiz', course}` with NO `cumulativeQuizId`), resolves via `resolveDefaultCumulativeQuiz(coursesDir, courseId)`: plain `cumulative_quiz.yaml` wins; else first numbered file (`cumulative_quiz_1-4.yaml` sorted by range start); else null → empty. Overlay (QuizOverlay START) always passes explicit `cq.id` from `getQuizIndex`.

### Milestones

- `CumulativeQuizSection` (`sections/CumulativeQuizSection.tsx`): Matching mixed MCQ/cloze/TF. TF questions rendered as 2-option MCQ. Same completion view with score ring and filtering. NOTE: `getCumulativeQuizMilestones` does NOT exist in code (AGENTS.md earlier claimed it did) — `QuizOverlay` shows cumulative quizzes from `getQuizIndex`.

## Content area button conventions
- Buttons inside `.book-content` (lesson viewer) must use `font-sans` to break from serif prose inheritance
- Secondary actions (e.g., Mark as Complete) use `variant="outline"` — clean border, no fill
- Primary CTAs (e.g., Go to Quiz) use `variant="primary"` (indigo fill) + lucide ArrowRight icon
- Never use text arrows (`→`) in locale strings — use lucide ArrowRight component
- Lesson bottom buttons are centered via `flex items-center justify-center gap-4`

## Highlight algorithm

Highlights use two-step offset-based approach:

1. **Offset capture at selection time**: `getTextOffset` in `lessonHelpers.tsx` uses `document.createTreeWalker(container, SHOW_TEXT)` to compute plain-text offset of selected range. TreeWalker avoids `range.toString()` which inserts implicit `\n` at block boundaries (paragraphs, headings, lists) — correcting the mismatch between DOM text (with newlines) and hast tree text (no newlines).

2. **Offset application via rehype plugin**: `rehypeHighlightText` (`rehypeHighlightText.ts`) walks hast tree with cumulative `pos` counter. For each text node, highlights overlapping `[startOffset, endOffset)` range are applied by splitting the text node and inserting `<mark>` elements. Single offset pair can span multiple text nodes across inline formatting (bold, italic, code) and block boundaries.

Key invariants:
- **Offset root**: measured from `[data-markdown-root]` wrapper around ReactMarkdown output (not from scroll container). Stored as `markdownRef` in `lessonViewStore`. This excludes h1 heading, meta fields, and DOM whitespace before markdown content.
- **Plugin order**: `rehypeHighlight` → `rehypeCloze` → `rehypeHighlightText`. Cloze runs before highlight matching so `{term}` patterns are removed from text nodes — offsets match clean rendered text.
- **Code blocks**: NOT skipped anymore. `applyHighlightsByOffset` descends into `<pre>`/`<code>` elements. Syntax-highlighted `<span>` wrapper is preserved, `<mark>` inserted inside syntax spans: `<span class="hljs-keyword"><mark style="background:yellow">const</mark></span>`. Syntax color + highlight background coexist.
- **Blockquotes**: skipped (`deeper = true`). Text inside `<blockquote>` not highlighted.
- **Mermaid code**: skipped. `isMermaidCode()` detects `code.language-mermaid`. Both `applyHighlightsByOffset` and `transformTree` skip descending into mermaid code blocks — `pos` counter doesn't advance past mermaid text. Critical because MermaidDiagram component renders SVG via `dangerouslySetInnerHTML`, so code text ABSENT from DOM. Without this skip, `getTextOffset` TreeWalker (DOM-based) returns shorter offsets than hast walker (which counts mermaid code text), causing all highlights AFTER mermaid diagram to shift by mermaid code text length, corrupting rendering.
- **Text-based fallback** (`transformTree`/`splitText`): only used for highlights with `endOffset === 0` (legacy data). Uses `indexOf` on individual hast text nodes — fails for cross-element selections. New highlights always have offsets.

`lessonViewStore.markdownRef` wired in `LessonContentViewer` via `useEffect`. `SelectionToolbar` and `NoteEditor` both use `markdownRef.current ?? contentRef.current` for offset computation.

## Test conventions

- **NO `mock.module` in test files**. All external lib mocks in `src/setup.tsx` (sonner, react-markdown, child_process, fs, mermaid, electrobun). Internal modules: use `spyOn` on `import * as NS` (refactor prod code if needed) or rely on real impl + store state control.
- **`mock.restore()` DESTROYS setup.tsx's global mocks**. Never call `mock.restore()` in individual test files — it undoes sonner/react-markdown/child_process/fs/mermaid/electrobun mocks process-wide.
- **Page/test files must call `setupRPC()`** at module level. Without it, RPC handler defaults to `Promise.resolve(null)` (works only if another test file happened to call it first — fragile ordering dependence).
- **Store state pollution across test files**: zustand stores persist in-memory. `resetAllStores()` in `src/setup.tsx` afterEach resets all 12 stores to initial state via `src/mainview/resetStores.ts`. Uses `createRequire` (sync) to avoid electrobun `window` module-eval issue that dynamic `import()` has. After reset, individual test files can still set store state in their own `beforeEach`. Previously manual `localStorage.clear()` + explicit store resets — now automated.
- **E2E tests excluded from bun**: `e2e/tests/` Playwright tests crash under `bun test` (Playwright `test.describe` not a bun API). Exclude via `package.json` `test` script or bun config.
- **Dashboard brand**: dashboard has own brand identity independent of book themes. Uses `dashboard-bg` CSS class (warm dark `#0b0d14` + radial gradient). Cards use `bg-[#131620]` with `border-white/[0.06]`. Brand palette in `colors.ts` (`DASHBOARD_BG`, `DASHBOARD_CARD_BG`, `DASHBOARD_CARD_BORDER`, `DASHBOARD_ACCENT`).
- **CourseCard**: single primary action only (Start/Continue/Complete). All quiz mode buttons (MCQ/Cloze/Cumulative/Cards) removed — modes accessed from inside course page. Hover glow via `hover:border-indigo-500/25`.
- **ResumeCard**: Continue CTA only. No MCQ/Cloze/Cumulative mini buttons. Progress bar + course info + prominent CTA.
- **StatsBar**: 2-tier layout — modules+study time as primary row (larger), streak+courses as secondary (smaller, border-top separator). SRS due warning rendered as dedicated amber callout card (`bg-amber-500/5 border-amber-500/15 rounded-lg`) below stats, not thin border-top text.
- **Greeting**: time-aware greeting in DashboardPage (`greetingKey()`). Keys: `dashboard.greetingMorning`, `dashboard.greetingAfternoon`, `dashboard.greetingEvening`.
- **ProgressBar 0% handling**: No `Math.max(2, pct)` guard. At 0%, fill bar is 0px wide (invisible), empty track stays visible.
- **CourseCard layout**: `flex flex-col h-full` container, `flex-1` above content, `mt-auto` on button row for bottom alignment. `line-clamp-2` on title for consistent card heights.
- **CourseCard arrow removed**: Right arrow icon removed from button row. Single CTA only.
- **Header spacing**: DashboardPage header action icons use `gap-1.5`.
- **UI tests via e2e**: Component/interaction tests impractical with bun + jsdom (Electrobun `BrowserView`, DOM measurement, scroll behavior, selection overlays all platform-specific). Use Playwright e2e tests for UI validation instead. Prefer at module level — page snapshots catch most regressions cheaply. Reach for e2e when testing: scroll-to-section, selection toolbar positioning, popover/overlay placement, keyboard shortcut dispatch, search highlight matching, page transitions.
