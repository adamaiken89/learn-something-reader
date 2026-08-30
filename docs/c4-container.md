# C4 Container Diagram — CourseReader (Level 2)

```mermaid
C4Container
  title Container Diagram — CourseReader

  Person(student, "Student", "Person using CourseReader")

  System_Boundary(cr, "CourseReader") {
    Container(frontend, "Frontend", "React 19 + TypeScript + Vite", "Renders UI, manages view stack via Zustand, communicates with backend via Electrobun RPC")
    Container(backend, "Backend", "Bun (Electrobun RPC handlers)", "Serves course data, quiz engine, SRS logic, persistence, search, stats, sync")
  }

  Rel(student, frontend, "Uses")

  System_Ext(fs, "File System", "subjects/ directory + ~/.coursereader/")

  Rel(frontend, backend, "BrowserView.defineRPC()", "Electrobun IPC (no network)")
  Rel(backend, fs, "Reads subjects YAML/MD/JSON, writes SRS deck + data.json + logs")
```

## Elements

| Element | Type | Technology | Description |
|---------|------|------------|-------------|
| Frontend | Container | React 19, TypeScript, Vite, Zustand | Renders UI in Electrobun webview. View stack routing, Tailwind CSS, react-markdown |
| Backend | Container | Bun, Electrobun RPC handlers | All API handlers: subjects, lessons, quizzes, SRS, storage, search, stats, sync |
| File System | External | Local disk | Course data in `subjects/<id>/`, prefs + annotations in `~/.coursereader/`, logs in `~/.coursereader/logs/` |

## Notes

- Single-process architecture: frontend (Electrobun webview) + backend (Bun RPC handlers in same process).
- Communication via `BrowserView.defineRPC()` — no HTTP server, no open ports. Type-safe RPC via `rpc-schema.ts`.
- All data is local file I/O on backend side. Frontend has no direct file access.
- No backend AI integration: AI skills forward prompts to the system browser via clipboard (see docs/ai-integration.md). No API keys, no external AI dependency.
