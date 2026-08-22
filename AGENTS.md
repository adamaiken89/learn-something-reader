# CourseReader — desktop study app (Electrobun + React)

## Architecture

React 19 + TypeScript frontend, Bun backend, packaged as desktop app via Electrobun.

```
src/
├── mainview/             # React frontend (Vite, root=src/mainview)
│   ├── layouts/          # PageLayout, PageHeader, PageContent
│   ├── pages/            # 7 pages: Dashboard, Lesson, Quiz, Review, UserCardReview, Settings, Bookmarks
│   ├── sections/         # Complex content: Lesson, Quiz, Review, UserCardReview
│   ├── components/       # Leaf-level reusable UI. No routing awareness.
│   ├── ai/               # AI skill configs, prompt builders, clipboard utils
│   ├── hooks/            # 22+ domain hooks
│   └── stores/           # Zustand (13)
├── types/                # Ambient declarations (three, jest-dom)
└── bun/                  # Backend (Electrobun RPC handlers)
```

Full per-file tree + Mermaid zoom/pan overlay internals: [`docs/architecture.md`](docs/architecture.md).

## Key conventions

- **Frontend → RPC → Backend handlers**. No direct file I/O from UI. Communication via `BrowserView.defineRPC()` — no HTTP server, no open ports.
- **Navigation**: React state-driven view stack. No React Router. Page transitions documented under [Page Transitions](#page-transitions).
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
- **Detail budget**: AGENTS.md holds frequently-applied conventions, invariants, and non-obvious gotchas. Infrequent deep-dives live in `docs/`, linked here (`see docs/foo.md`). Move detail out when a section grows past ~10 lines and isn't touched weekly. Decision rationale goes to `docs/`, not here.
- **i18n first**: all text via `t('key')`. Locale files at `src/mainview/locales/*.json` (4 locales: en-US, en-GB, zh-CN, zh-TW). Adding UI text requires keys in all 4 locales + snapshot update.
- **Icons via lucide-react**: never emoji in locale strings. Import lucide components directly. Theme icons (`themes.ts` `THEME_ICONS` + locale `icons.*` emoji) are legacy — migrate to lucide when touched.
- **Keyboard shortcuts**: single source of truth at `src/mainview/shortcuts.ts`. All shortcut key/ID/scope defined there. Components import `shortcutKey(id)` for display use. Handlers kept in components (switch statements) — scope overlap intentional where same key does same action in different scopes. Adding new shortcut requires entry in `shortcuts.ts` + handler in component. Duplicate detection runs at module load.
- **Effect cleanup**: Use `useEffectEvent` (React 19) for event listener effects that reference reactive values. Extracts handler into stable callback, effect registers listener once. Pattern: `const onKey = useEffectEvent((e: KeyboardEvent) => { /* uses state */ }); useEffect(() => { window.addEventListener('keydown', onKey); }, []);`. Eliminates listener re-registration when callback identity changes. Applied in: QuizSection, CumulativeQuizSection, useQuizKeyboard, ReviewSection, SettingsPage, BottomSheet, MermaidOverlay, useNotePopoverOnClick.
- **React Compiler (auto-memo)**: `babel-plugin-react-compiler` v1.0.0 active via `vite.config.ts` `reactCompilerPreset()`. Compiler auto-memoizes values + components at build time. Manual `useMemo`/`useCallback` is redundant — compiler handles it. These hooks are removed from codebase. Exception: keep `useMemo` only for genuinely expensive computations (>1ms) verified by profiling, but none known currently. `eslint-plugin-react-compiler` set to `error` to prevent reintroduction.

## Course data model

Subjects in `.coursereader/subjects/<dir>/` (dev: `src/subjects/`). Dir name → `Subject.id`. Each subject:

- `syllabus.yaml`
- `modules/<NN-name>/lesson.md`
- `modules/<NN-name>/quiz.yaml`
- `srs/deck.json` (FSRS-5 SRS)

Module dir matching: `findModuleDir` scans `modules/<id>/` for `NN-` prefix.

## YAML parsing (`src/bun/yaml.ts`)

Thin wrapper over **js-yaml** v5 (only consumer: `courseLoader.ts`). `parse()` returns `YamlValue`, `null` for empty/whitespace/comment-only docs. Options: `{ schema: CORE_SCHEMA, json: true }`:
- `CORE_SCHEMA` — dates/yes/no/1.10 stay strings (no JS type coercion)
- `json: true` — duplicate keys last-wins (JSON.parse semantics, no throw)
- Malformed YAML **throws** (js-yaml) — strict by design; callers needing lenient behavior must catch, do NOT expect null from syntax errors
- Multi-line plain scalars fold to single space-joined string (old custom parser truncated at first line — regression test in `yaml.test.ts`)

Subjects path resolution (`src/bun/utils.ts` `findSubjectsDir`):
1. `src/bun/subjects/` (dev, adjacent to source)
2. `src/subjects/` (dev, one level up)
3. `~/.coursereader/subjects/` (production fallback)

## Data persistence

- Subjects/lessons/quizzes: file I/O from `.coursereader/subjects/` tree
- SRS decks: `.coursereader/subjects/<id>/srs/deck.json`
- Highlights, notes, bookmarks, user cards, completion, quiz schedules: `~/.coursereader/data.json`
- Gemini API key: `~/.coursereader/prefs.json` _(legacy — Tier 1 AI uses clipboard+browser, no key needed)_
- Logs: `~/.coursereader/logs/<YYYY-MM-DD>.log`

### data.json schema (runtime validation)

`src/bun/schema.ts` — hand-rolled runtime validator for `StorageData` (`src/bun/types.ts`). **All reads go through `sanitizeStorageData()`**:
- **Repair-mode**: records type-checked per-field; invalid records dropped individually, valid kept (one bad note never wipes 219 sessions). `dropped` count returned for logging.
- Missing arrays default to `[]`; invalid collection/record/map types dropped with `dropped += 1`.
- Optional fields preserved as-is when valid: `remoteRepoURL`, `lastSyncedCommit`/`lastSyncTime` (string|null), `lastSession` (loose nested check), `moduleSessions`/`quizSchedule` (per-value map check).
- Unknown top-level keys preserved — forward-compat, not stripped.
- `version?: number` accepted for future migrations (none pending).
- **Both loaders unified**: `_loadFresh` (`persistence.ts`) + `loadStorage` (`search.ts`) call the same sanitizer — no dual-parser drift.
- **Corrupt data.json**: `_loadFresh` backs up original to `data.json.bak-<ts>` before returning empty defaults (kills old silent data-loss path). `parse`-fail and per-record repair both `logger.warn`.
- **New records must satisfy** `Highlight`/`Note`/`Bookmark`/`StudySession`(enum `reading|quiz|review`)/`CompletedModule`/`QuizSchedule`/`ModuleSession` shapes or they get dropped on next load. Tests feeding `data.json` fixtures must use full record shapes (see `src/bun/schema.test.ts`).

## Scroll layout invariant

`PageContent` (`src/mainview/layouts/PageContent.tsx`) MUST have `flex flex-col` classes — the real scrollbar lives on `contentRef` only when `PageContent` is a flex container. Without them, `div.flex.flex-1.overflow-hidden` inside `LessonSection` gets unbounded height → inner `contentRef` (`overflow-y-auto`) never overflows → `scrollToSection` on `contentRef.scrollTop` silently does nothing. If `contentRef` has `overflow-y-auto` but sections are always at scrollTop 0, check `PageContent` hasn't lost `flex flex-col`.

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
- **Mermaid zoom/pan overlay**: full-view overlay, CSS transform translate/scale, drag pan + wheel zoom toward cursor, 0.5x–5x limits, no animation. Inline diagram = crop-to-content normalized (parseSvgSize returns viewBox origin; layout box = viewBox rect exactly; `getBBox` shifts abs-positioned frame to `(0,0)` — negative-origin mindmaps otherwise clip unscrollable at left/top; `.mermaid-inline svg` CSS-stretched to fill frame so visual==layout box; inline container `justify-content: flex-start`, centering owned by pan.x). Offsets in state (`dims`), NEVER imperative svg style mutation — happy-dom+React19 recreate innerHTML children on re-render, wiping them. Home = `computeWidthHome(viewportW, content, heightBudget, minFontSize)` single clamp formula: `zoom = clamp(min(availW/w, budget/h)×0.85 headroom, LEGIBLE_PX/base, min(MAX_COMFORT_FONT_PX/base, INLINE_MAX_ZOOM=3))` (base = detected min font, fallback 16; fit-first — may shrink below 1:1 but painted text stays in 12–18px comfort band; wide diagrams scroll horizontally; container height tracks zoom but caps at `INLINE_MAX_BOX_H=520px` — overflow scrolls internally; `rehome` useEffectEvent re-fits via `[svg]` effect + width-gated ResizeObserver on content-width change, `lastRoWRef` skips self-inflicted boxH resizes so wheel-zoom isn't reset). Auto-fit: `mermaid-fit` button (controls-on only) → `computeFitHome` shrinks whole diagram to `FIT_VIEW_RATIO` (0.8) of the box, centered, floor 0.2). Inline zoom controls hidden until `mermaid-controls-toggle` clicked (wheel zoom gated too); fullscreen always visible. Inline toolbar + overlay toolbar carry `data-testid`s (`mermaid-zoom-in/-out/-reset/-pct`, `mermaid-fullscreen`, `mermaid-controls-toggle`, `mermaid-overlay-*`) — tests must use them, not text-content selectors. Toolbar strings i18n under `mermaid.*` (zoomIn/zoomOut/fullscreen/loading/reset/zoomToggle/fit); inline `1:1` label literal. Internals: [`docs/architecture.md`](docs/architecture.md).
- **E2E mock RPC**: `mockRPC.ts` uses `Proxy` + handler table. Unknown methods `reject` (not silent null). Add new RPC handler key when backend adds handler.
- **TS7 dual setup**: `typescript@6.0.2` (JS API for eslint/typescript-eslint) + `@typescript/native@npm:typescript@^7.0.2` (Go `tsc` binary). Install TS6 first so `.bin/tsc` links to TS7. `tsconfig.json` needs `"types": ["*"]` (TS7 default is `[]`). Bun alias resolution differs from node — use direct installs, not `@typescript/old`.

## Button styling conventions

- **`Button` component** (`src/mainview/components/ui/Button.tsx`): base shadow via `shadow-sm`, hover: `shadow-md` + `-translate-y-0.5`, transition `transition-all duration-150`. `variant` controls bg/border/text colors (primary=indigo, outline=border, ghost=transparent).
- **Toolbar buttons** (lesson toolbar, search, zoom, etc.): `shadow-none` (override Button's `shadow-sm`), `hover:bg-gray-700/30` subtle background instead of lift.

## Dashboard design conventions

- **Dashboard brand**: dashboard has own brand identity independent of book themes. Uses `dashboard-bg` CSS class (warm dark `#0b0d14` + radial gradient). Cards use `bg-[#131620]` with `border-white/[0.06]`. Brand palette in `colors.ts` (`DASHBOARD_BG`, `DASHBOARD_CARD_BG`, `DASHBOARD_CARD_BORDER`, `DASHBOARD_ACCENT`).
- **CourseCard**: compact grid card — `text-base` title (`line-clamp-1`), single meta line (inline level badge + `{h}h · N modules`, no `CourseTags` component), `size="sm"` ProgressBar, small single action button (Start/Continue/Complete), `done/total` inline right of button. Click → syllabus. `flex flex-col h-full justify-between`.
- **ResumeCard**: single compact row (flex items-center, no mb-4 — spacing owned by hero row). Left: Resume label + course name + one subtitle line `Module: X · Next: Y` (or `· Course complete` via `dashboard.courseCompleteShort`, no emoji). Middle (sm+): `done/total` + `(pct%)` + ProgressBar (hidden when total 0). Right: Continue CTA with ArrowRight. handleContinue pushes lesson view w/ sectionID.
- **StatsBar**: single-row 4-stat strip (Modules `n/m`, Study Time, Day Streak emerald Flame, Courses) fixed `lg:w-[380px]` in hero row. No SRS callout (SRS due lives in ReviewNowPanel).
- **ReviewNowPanel** (`components/dashboard/ReviewNowPanel.tsx`): unified reinforcement slot ABOVE course grid. Per-course rows merging SRS + quiz due: `srsDueCount` from `globalStats.courseSummaries`, quiz ready/overdue counts from `useQuizDueStatus` (ready/overdue props, DashboardPage owns the fetch — panel is props-only). Row shows amber SRS badge + amber ready badge + rose overdue badge + Review CTA. Row click: quiz due → `quizHub`, SRS only → `review`. Sort: quizOverdue > quizReady > srsDue desc. `ROW_LIMIT=4` + expand. Hidden when loading or no rows.
- **CourseGrid toolbar**: search input (displayName, case-insensitive) + status tabs All/In Progress/Not Started/Completed with live counts from completionStore. Default All. Empty filter result → `dashboard.noMatch` text. Grid stays `lg:grid-cols-3`.
- **Landing order**: greeting → hero row (ResumeCard flex-1 + StatsBar 380px) → ReviewNowPanel → course library toolbar + grid.
- **Backend stats shape**: `GlobalStats.courseSummaries[]` carries `srsDueCount` + `srsTotalCards` per course (computed in `getGlobalStats`). `CourseStats` carries `moduleSrsDue: Record<moduleId, count>` for per-module SRS badges.
- **SyllabusPage module badges**: each module row fetches `api.quiz.status` + `api.stats.course` → shows rose "Quiz overdue" / amber "Quiz ready" chip + amber `{{count}} cards due` chip when due. Reuses `syllabus.quizOverdue/quizReady/srsDue` keys.
- **Greeting**: time-aware greeting in DashboardPage (`greetingKey()`). Keys: `dashboard.greetingMorning`, `dashboard.greetingAfternoon`, `dashboard.greetingEvening`.
- **ProgressBar 0% handling**: No `Math.max(2, pct)` guard. At 0%, fill bar is 0px wide (invisible), empty track stays visible.
- **Header spacing**: DashboardPage header action icons use `gap-1.5`.

## Clipboard fallback

`useClipboardFallback` (mounted in `App.tsx`) listens for window-level `copy`/`cut` events. When `clipboard-write` permission unavailable (Electrobun), uses `document.execCommand('copy')` fallback. Also overrides Ctrl+A in lesson content viewer to select all text in `contentRef`.

## AI Integration

Two tiers: clipboard-forwarding (no setup) vs deep API (Gemini key).

### Tier 1: Clipboard + Browser (default, no API key)

Opens Perplexity (`perplexity.ai/search?q=`). Stable URL, intended search API. Previously used Google AI Mode (`udm=50` undocumented param) — migrated to Perplexity for reliability.

Why clipboard+browser over in-app chat, costs accepted, pedagogical notes, prompt maintenance, system-browser mechanics: [`docs/ai-integration.md`](docs/ai-integration.md).

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

### System browser (Utils.openExternal)

`copyPrompt()` (`ai/utils.ts`) copies prompt to clipboard, opens Perplexity in system browser via RPC (`api.shell.openExternal`). Backend calls `Utils.openExternal(url)` from `electrobun/bun`. Prompt appended as `?q=` URL param (sliced 6000 chars) for auto-fill. Full prompt on clipboard for long prompts. 6000 avoids HTTP 431 from URL + header size exceeding server/proxy limits.

### Happy-dom event propagation limitation

`setup.tsx:128-130` uses happy-dom `Window`. happy-dom NOT reliably bubble `KeyboardEvent` from `document.body` → `window`. Affects all `window.addEventListener('keydown', handler)` tests.

**Fix**: Use `pressKey(key)` from `testUtils.ts` instead of `user.keyboard('{Key}')`. `pressKey` dispatches directly on `window` via `window.dispatchEvent(new KeyboardEvent(...))` wrapped in `act`. Bypasses bubbling issue.

Use `user.keyboard()` only for tests needing focus management. For raw `window.addEventListener` dispatch, `pressKey()` is more reliable.

## Animations & timing

- **`useCountUp`** (`src/mainview/hooks/useCountUp.ts`): animated number counter using `setTimeout` loop (16ms intervals). Cubic ease-out. Avoid `requestAnimationFrame` — setup.tsx mocks RAF as `cb(0); return 0` (fires synchronously, `performance.now()` static), which causes infinite recursion.
- **StatsBar test assertions**: `StatCard` counts animate via `useCountUp`. Avoid relying on exact animated value — check for surrounding text like `/10` instead of `4/10`.

## Lesson → Quiz user flow
- Lesson bottom: quiz mode buttons (combined `Quiz` — MCQ+cloze in one test — + optional `Cumulative`) + one completion button. If `hasNext` → primary "Complete & Next →" (calls `handleToggle()` then `goNext()`). If `!hasNext` (last module) → stateful `LessonContentCompletionButton` (outline, label flips to green "Completed" on click — do NOT render a static-label Button here or completion gives zero feedback). Centered flex row. Cumulative button present when `api.quiz.hasCumulative(courseId)`.
- Quiz completion: "Next Chapter →" (if not last module) or "Back to Dashboard" (if last module). Navigates `push({ type: 'lesson', course, module: nextModule })`
- No auto-redirect. User clicks buttons.

## Quiz types (2)

| Type | Data file | Page | Section | View type |
|------|-----------|------|---------|-----------|
| Module (combined) | `modules/N/quiz.yaml` + `modules/N/cloze.yaml` merged into ONE test | QuizPage | QuizSection | `quiz` |
| Cumulative | `cumulative_quiz.yaml` (hybrid: `source_modules: [N]` mapping + sequence) | CumulativeQuizPage | CumulativeQuizSection | `cumulativeQuiz` |

### Quiz page headers

All study pages (QuizPage, CumulativeQuizPage, ReviewPage, QuizHubPage) use shared `QuizHeader` (`components/QuizHeader.tsx`): wraps `PageHeader` with `onBack` + CourseSwitcher centered + optional `title` (left slot, after back divider). `title` shows module/course name + quiz type via i18n. Keys `lesson.clozeQuiz` ("Cloze Drill"), `lesson.cumulativeQuiz` ("Cumulative Review"), `common.quiz` live in the **lesson** block, NOT `quiz.*` (quiz block only has engine strings like loadingQuiz/noQuestions/clozeCheck/clozeTryAgain). CumulativeQuizPage appends `displayLabel(id)` range suffix ` (01–03)` parsed from `cumulative_quiz_NN-NN.yaml`. Page tests mounting QuizHeader must `mockResponse('coursesList', [])` (CourseSwitcher fetches course list; mockRPC rejects unmocked methods).

### Quiz Hub + drive-through

- **QuizHubPage** (`pages/QuizHubPage.tsx`, view type `quizHub`, route in `App.tsx`): course-level quiz list replacing the old `QuizOverlay` modal (deleted). Uses `QuizHeader` (back + CourseSwitcher center + `quizHub.title`). Fetches BOTH `api.quiz.index` and `api.quiz.status`. Sections: Start Review (first cumulative), Module Quizzes (SINGLE clickable row per module — number circle, name, sub-label `MCQ · Cloze`, then `AttemptBadge`), Cumulative Reviews (range labels), bottom Review link. All quizzes always accessible — no locking/gating; subtitle text explains states. `AttemptBadge`: `—` unattempted, `✓ NN%` emerald if ≥80 else rose, amber `Due` chip.
- **quizDrive util** (`quizDrive.ts`): canonical quiz ordering + navigation. `presenceFromIndex`/`presenceFromStatus` → `QuizPresence`; `QuizDriveKind = 'module' | 'cumulative'`; `buildQuizOrder` (module→next module→cumulative by milestone) → `QuizTarget[]` with key scheme `module:${moduleId}` / `cumulative:${id}`; `nextQuizAfter(course, presence, currentKey)` → next target or null; `targetAttempt(status, target)` → attempt or null; `dueTargets(course, status)` → targets via `dueStateOf` = `'ready'|'overdue'|'none'`; `targetToView(course, target)` → View for push (module→`{type:'quiz'}`, cumulative→`{type:'cumulativeQuiz'}`). buildQuizOrder/presenceFromStatus are module-private.
- **Next Quiz chaining**: both quiz sections fetch `api.quiz.index` on mount, compute `nextQuizAfter` for their own key, pass `onNextQuiz` → `QuizCompletionView` renders success-colored "Next Quiz" CTA (replaces NextChapter/BackToDashboard when present). Sections fall back to NextChapter (lesson) / BackToDashboard when no next quiz.
- **Quiz scheduling (backend, `stats.ts`)**: interval-ladder reminders, NOT fixed 3-day. Constants `LADDER_DAYS=[3,7,14,30]`, `PASS_RATIO=0.8`. `nextIntervalDays(prev, passed)` — pass escalates ladder (3→7→14→30, 30→30), fail resets to 3. `logSession` RPC calls `recordQuizResult(courseID, moduleID, score, total)` after `addStudySession` (quiz type only) — writes `QuizSchedule {intervalDays, nextDue}` into `data.quizSchedule` keyed `${courseID}:${moduleID}` (single module quiz → plain moduleId; cumulative → `cq.id`). **Lazy migration**: `ensureSchedule` in `getQuizStatus` seeds from last session date +3d, or lesson-completedAt +3d if never quizzed (cumulative never seeded unattempted). `dateStr` comparisons are local-TZ.
- **`api.quiz.status(courseId)`** (backend `stats.ts` `getQuizStatus`, schema `quizStatus`): per-course `CourseQuizStatus` = modules with single `attempt` `QuizAttemptStatus|null` (true only when module has quiz via `QuizIndex.modules` flag) + cumulativeQuizzes with `attempt`. `QuizAttemptStatus {attempted, score, total, date, due, overdue, ready}`. Due semantics from schedule: `overdue = nextDue < today`, `ready = nextDue == today`, `due = overdue || ready`. Old fixed `QUIZ_DUE_DAYS=3` const survives only as legacy seed interval.
- **Dashboard due card**: `useQuizDueStatus` hook (`hooks/useQuizDueStatus.ts`) fetches `api.quiz.status` per course, splits `dueTargets` by `dueStateOf` into `{ready, overdue}` (union `due`). **Stale-refresh**: watches `viewStore.views` — re-fetches when view stack pops back to dashboard (dashboard stays mounted under pushed views). Card sits BELOW CourseGrid, `bg-[#131620]` dashboard palette, header `{{ready}} ready · {{overdue}} overdue`, [Start] CTA → most-overdue course quizHub, rows capped at `DUE_ROW_LIMIT=4` + `+N more` expand toggle, row click → that course quizHub. Hidden when nothing due.
- **Launch notification**: `useQuizDueNotification` (`hooks/useQuizDueNotification.ts`, mounted in `App.tsx`) fires one web Notification when any quiz due. Pattern: permission `granted` → `new Notification('CourseReader', {body})`, `default` → requestPermission, guard `typeof Notification === 'undefined'` (tests). Body via `notification.quizDue.statusSplit` key (mirrors dashboard ready/overdue split).

### Quiz section architecture

- **All quizzes shuffle** question order on load: `useQuizEngine` runs `normalizeClozeBlanks(shuffleQuestions(qs))` (Fisher-Yates) over `api.quiz.start` results; cumulative loader feeds the same `useQuizEngine` path. `shuffleQuestions`/`clozeAnswers`/`clozeCorrect`/`normalizeClozeBlanks` live in `quizUtil.ts` (`src/mainview/quizUtil.ts`). Tests stub `Math.random = () => 0.999` to keep order stable.
- **QuizSection** (`sections/QuizSection.tsx`): full combined module quiz — MCQ grid + cloze text input in one test. Uses `useQuizEngine()` (default loader → `api.quiz.start()` which now returns `[...loadQuiz(), ...loadClozeQuiz()]` merged).
- **CumulativeQuizSection** (`sections/CumulativeQuizSection.tsx`): Mixed MCQ + cloze + TF. Uses `useQuizEngine(courseId, quizId, loader)` with custom loader → `api.quiz.cumulative()`. NOTE: `getCumulativeQuizMilestones` does NOT exist in code — QuizHubPage shows cumulative quizzes from `getQuizIndex`.
- **QuizSection + CumulativeQuizSection** share `QuizCompletionView` for post-quiz summary (confetti, SVG score ring, filter tabs, review cards).
- **TF questions**: parser auto-fills `options: { True: 'True', False: 'False' }` when type=`tf` and options empty. Rendered as 2-button MCQ grid.
- **Cloze scoring** (`quizUtil.ts`): `cloze.yaml` `answer` field holds only FIRST `{term}`; multi-blank questions need all terms. Backend normalizes cloze answer at load time (`normalizedClozeAnswer` in `courseLoader.ts` parses all `{term}`s, comma-joins). `clozeAnswers(q)` (parses all `{term}`s from question text, falls back to `[q.answer]`) and `clozeCorrect(q, ua)` (trim/lowercase compare against comma-joined parsed answers) handle scoring. Stored user answer is comma-joined full blank set — NEVER compare cloze against `q.answer` alone or multi-blank questions score wrong. Session-log scoring in `useQuizEngine` (`hooks/useQuizEngine.ts`) MUST reuse `clozeCorrect(q, userAnswer)` — a former inline `userAnswer === q.answer` compare diverged from display scoring and mis-logged multi-blank/case-mixed cloze (logged a "failed" last attempt for actually-correct answers).
- **Cloze question formats** (two in the wild): inline `{term}` (answer inside braces; `normalizedClozeAnswer` extracts terms) vs literal `{blank}` directive (real answer in `answer:` field, multi-blank comma-joined). `normalizedClozeAnswer` MUST be `{blank}`-aware: skip placeholders whose term is literally `blank` (probe: `"A {blank}...{blank} block."` + `"trace_id, finally"` → `"blank, blank"` before fix). Quiz question display: `QuizSection`/`CumulativeQuizSection` render via `QuizClozeQuestion` (`components/quiz/QuizClozeQuestion.tsx`), which uses `parseClozeText` to replace blanks with dashed `<span>`s — do NOT render raw `{term}` in quiz `<h2>` (leaks answer) and do NOT strip braces any other way (lesson viewer `rehypeCloze` is viewer-only).
- **Cloze two-attempt rule** (`quizStore.ts` + `QuizClozeInput`): first wrong answer → amber "try again" warn (`quiz.clozeTryAgain`), answer NOT locked, question stays editable, no reveal. Second attempt → resolves: correct scores full marks, wrong reveals answer (`quiz.clozeWrongAnswer`) and scores 0. MCQ answers lock after one click as before. `clozeAttempts: Record<qid, number>` state tracks attempts; reset on setQuestions/retry/reset.

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
2. **Hybrid mapping** (`source_modules: [..]` then `questions:` key with nested list) — `yaml.ts` returns a mapping object. (llm-basics)

`parseCumulativeQuiz()` (`courseLoader.ts`) handles BOTH: if parse result is an array → map questions; if it's an object with `questions` array → map those; else empty. Do NOT assume one format — `!Array.isArray(raw) → empty` silently killed hybrid courses.

### Default quiz resolution

`loadCumulativeQuiz(courseId, id?)` — when `id` omitted (LessonContentViewer/SyllabusPage push `{type:'cumulativeQuiz', course}` with NO `cumulativeQuizId`), resolves via `resolveDefaultCumulativeQuiz(coursesDir, courseId)`: plain `cumulative_quiz.yaml` wins; else first numbered file (`cumulative_quiz_1-4.yaml` sorted by range start); else null → empty. QuizHubPage / START button always passes explicit `cq.id` from `getQuizIndex`.

## Content width ladder (lesson reader)
`settingsStore.contentWidth` (`ContentWidth = 'narrow'|'standard'|'wide'|'full'`, persisted `coursereader-width`). CSS in `index.css` uses **viewport-adaptive caps** so options stay distinct at any window size (no degeneration to full-width on small windows):
- `narrow` → `min(720px, calc(100% - 96px))`
- `standard` → `min(960px, calc(100% - 64px))`
- `wide` → `min(1280px, calc(100% - 32px))`
- `full` → `max-width: none` (only option with no extra side gap; internal `padding: 2.5rem 2rem` always applies)
All centered via `margin: 0 auto`. Class applied in `LessonContentViewer.tsx`. Locale keys `lesson.narrow/standard/wide/full`. Default window frame 1280×800 (`src/bun/index.ts`) — sidebar 288px open leaves exactly enough for `standard` (thoughtful gap math only; full powers immersive mode at 4K).

## Font family switch (lesson reader)
`settingsStore.textFont` (`TextFont`, persisted `coursereader-textfont`, default `'georgia'`) + `settingsStore.codeFont` (`CodeFont`, persisted `coursereader-codefont`, default `'sfmono'`). Definitions + CSS stacks in `fonts.ts` (`TEXT_FONTS`/`CODE_FONTS` arrays, `fontToCSSVars(text, code)` → `--book-font-text`/`--book-font-code`). System font stacks only (no bundled web fonts) — every option carries cross-platform fallbacks; missing fonts degrade gracefully. Applied via inline style on `.book-content` div in `LessonContentViewer.tsx` alongside `themeVars`. CSS consumers: `.book-content` prose, `.book-content code`, `blockquote`, mermaid error, language badge all read the vars with hardcoded fallbacks matching defaults. **Scope is lesson reader only** — UI chrome stays system-ui, quiz pages untouched. Settings UI: two Pill rows in `AppearanceSection` + same rows in lesson `AppearancePopover` (top-bar Palette; shared `Pill` takes optional `style` for live-preview stack, `aria-pressed` marks active); headers i18n `settings.textFont`/`settings.codeFont`, font names literal proper nouns (not translated). Defaults preserve pre-feature rendering exactly.

## Content area button conventions
- Buttons inside `.book-content` (lesson viewer) must use `font-sans` to break from serif prose inheritance
- Secondary actions (e.g., Mark as Complete) use `variant="outline"` — clean border, no fill
- Primary CTAs (e.g., Go to Quiz) use `variant="primary"` (indigo fill) + lucide ArrowRight icon
- Never use text arrows (`→`) in locale strings — use lucide ArrowRight component
- Lesson bottom buttons are centered via `flex items-center justify-center gap-4`

## Highlight algorithm

Highlights use two-step offset-based approach: offset capture at selection time (`getTextOffset` TreeWalker) + offset application via `rehypeHighlightText` hast walker. Full walkthrough + `markdownRef` wiring: [`docs/highlights.md`](docs/highlights.md).

Key invariants:
- **Offset root**: measured from `[data-markdown-root]` wrapper around ReactMarkdown output (not from scroll container). Stored as `markdownRef` in `lessonViewStore`. This excludes h1 heading, meta fields, and DOM whitespace before markdown content.
- **Plugin order**: `rehypeHighlight` → `rehypeCloze` → `rehypeHighlightText`. Cloze runs before highlight matching so `{term}` patterns are removed from text nodes — offsets match clean rendered text.
- **Code blocks**: NOT skipped anymore. `applyHighlightsByOffset` descends into `<pre>`/`<code>` elements. Syntax-highlighted `<span>` wrapper is preserved, `<mark>` inserted inside syntax spans: `<span class="hljs-keyword"><mark style="background:yellow">const</mark></span>`. Syntax color + highlight background coexist.
- **Blockquotes**: skipped (`deeper = true`). Text inside `<blockquote>` not highlighted.
- **Mermaid code**: skipped. `isMermaidCode()` detects `code.language-mermaid`. Both `applyHighlightsByOffset` and `transformTree` skip descending into mermaid code blocks — `pos` counter doesn't advance past mermaid text. Critical because MermaidDiagram component renders SVG via `dangerouslySetInnerHTML`, so code text ABSENT from DOM. Without this skip, `getTextOffset` TreeWalker (DOM-based) returns shorter offsets than hast walker (which counts mermaid code text), causing all highlights AFTER mermaid diagram to shift by mermaid code text length, corrupting rendering.
- **Text-based fallback** (`transformTree`/`splitText`): only used for highlights with `endOffset === 0` (legacy data). Uses `indexOf` on individual hast text nodes — fails for cross-element selections. New highlights always have offsets.

## Test conventions

- **NO `mock.module` in test files**. All external lib mocks in `src/setup.tsx` (sonner, react-markdown, child_process, fs, mermaid, electrobun). Internal modules: use `spyOn` on `import * as NS` (refactor prod code if needed) or rely on real impl + store state control.
- **`mock.restore()` DESTROYS setup.tsx's global mocks**. Never call `mock.restore()` in individual test files — it undoes sonner/react-markdown/child_process/fs/mermaid/electrobun mocks process-wide.
- **Page/test files must call `setupRPC()`** at module level. Without it, RPC handler defaults to `Promise.resolve(null)` (works only if another test file happened to call it first — fragile ordering dependence).
- **Store state pollution across test files**: zustand stores persist in-memory. `resetAllStores()` in `src/setup.tsx` afterEach resets all 12 stores to initial state via `src/mainview/resetStores.ts`. Uses `createRequire` (sync) to avoid electrobun `window` module-eval issue that dynamic `import()` has. After reset, individual test files can still set store state in their own `beforeEach`. Previously manual `localStorage.clear()` + explicit store resets — now automated.
- **E2E tests excluded from bun**: `e2e/tests/` Playwright tests crash under `bun test` (Playwright `test.describe` not a bun API). Exclude via `package.json` `test` script or bun config.
- **UI tests via e2e**: Component/interaction tests impractical with bun + jsdom (Electrobun `BrowserView`, DOM measurement, scroll behavior, selection overlays all platform-specific). Use Playwright e2e tests for UI validation instead. Prefer at module level — page snapshots catch most regressions cheaply. Reach for e2e when testing: scroll-to-section, selection toolbar positioning, popover/overlay placement, keyboard shortcut dispatch, search highlight matching, page transitions.
