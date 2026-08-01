# CourseReader Conventions

All conventions, architecture, quirks, and test conventions are maintained in [`AGENTS.md`](../AGENTS.md) — the single source of truth for codebase conventions.

This file exists for discoverability only. See `AGENTS.md` for:

- Architecture overview + project structure tree
- Key conventions (navigation, state management, store isolation, i18n, icons, keyboard shortcuts)
- Course data model and data persistence
- Search (global + in-lesson)
- Page transitions
- Scroll layout invariant
- Lesson → Quiz user flow + content area button conventions
- Test conventions
- Quirks and edge cases

Deep-dive docs (linked from AGENTS.md):

- [`architecture.md`](architecture.md) — full per-file tree, Mermaid zoom/pan overlay internals
- [`ai-integration.md`](ai-integration.md) — AI decision rationale, pedagogical notes, prompt maintenance
- [`highlights.md`](highlights.md) — highlight offset algorithm walkthrough
