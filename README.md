<p align="center">
  <img src="assets/icon.svg" alt="CourseReader logo" width="128" />
</p>

<h1 align="center">CourseReader</h1>

<p align="center">
  Desktop study app for structured curricula with quizzes, spaced repetition, AI study tools, and persistent annotations.
</p>

<p align="center">
  <a href="https://github.com/adamaiken89/courses/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/bun-1.0+-orange.svg" alt="Bun" /></a>
  <a href="https://github.com/adamaiken89/courses/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" /></a>
</p>

## Features

- **Course reading** — structured curricula with book-like prose, 18 themes, adjustable font size, page transitions, section navigation, and in-lesson search
- **Quizzes** — MCQ, cloze drill, and cumulative review quizzes with instant scoring and confetti
- **Spaced repetition** — FSRS-5 flashcard deck with due/starred/all filters + custom user cards
- **AI study tools** — Feynman Explain, Reframe, and Drill skills that copy prompts to Perplexity (zero setup, no API key)
- **Annotations** — persistent highlights, notes, and bookmarks per module
- **Search** — ⌘K global search across lessons, notes, and highlights with section-level scroll-to
- **Study tools** — pomodoro timer, focus mode, per-course/global stats, keyboard shortcuts
- **Internationalization** — 4 locales (English US/GB, 繁體中文, 简体中文)

See [`docs/`](docs/) for detailed architecture, conventions, and reading experience.

## Requirements

- [Bun](https://bun.sh/) 1.0+
- macOS (Electrobun desktop app)

## Quick start

```sh
bun install            # install dependencies
bun run start          # build + launch desktop app
```

## Development

```sh
bun run dev            # dev mode (HMR via Vite)
bun run dev:hmr        # Vite HMR + Electrobun concurrently
bun run build          # production build
bun test               # run all tests (bun:test + happy-dom)
bun run check          # tsc + eslint + prettier
bun run knip           # find unused code/exports/dependencies
```

## Tech stack

| Purpose            | Library                                  |
| ------------------ | ---------------------------------------- |
| Desktop shell      | Electrobun                               |
| UI                 | React 19 + TypeScript strict mode        |
| State management   | Zustand                                  |
| Styling            | Tailwind CSS                             |
| Markdown           | react-markdown + remark-gfm + rehype-highlight |
| i18n               | i18next + react-i18next                  |
| Diagrams           | Mermaid                                  |
| Build              | Vite + Bun                               |

## License

MIT
