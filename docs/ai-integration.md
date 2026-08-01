# CourseReader AI Integration — decision record & deep detail

`AGENTS.md` holds the working summary (tiers, skills table, consent, section handling). This file holds the rationale and infrequently-needed mechanics. See `AGENTS.md` for the applied summary.

## Why clipboard+browser over in-app chat

- Zero friction (no API key, no account linking)
- User brings own AI (ChatGPT/Claude/Gemini/Perplexity — paste anywhere)
- No credential storage, no backend AI costs

Costs accepted:
- Output silo (AI answers never auto-save to notes/highlights)
- 4-step UX chain: click → copy → switch tab → paste
- No measurement/analytics for v1 (`logSession` type union doesn't include `'ai_skill'`)

## Pedagogical notes

- **Feynman text vs speech**: Text-Feynman loses oral feedback loop. Acceptable because: forces precise written explanation, AI can quote exact passages back, many users study in public. Research basis: Fiorella & Mayer (2015) — written explanatory still > restudy.
- **Drill vs built-in quiz/SRS**: Differentiator is dynamic adaptation. Quiz is static pre-authored questions. AI drill generates novel synthesis questions. Single-turn limitation means questions generated upfront with answers — user self-tests.
- **Scope ceiling**: Clipboard approach self-limits — cannot auto-inject AI output into app (notes, highlights, cards). Write-back requires Tier 2 (API key + in-app chat). Two tiers coexist in same AITab: clipboard by default, deep integration when user provides key.

## Prompt maintenance

Prompts in `ai/skills.ts` are English-only (AI persona instructions stay English regardless of user locale). UI labels use existing i18n. Prompts may degrade as AI models change — single file to update. Prompts trimmed to 50-80 words instruction + hint slot + lesson content. Each skill self-contained (no shared instructions).

## System browser (Utils.openExternal) mechanics

`copyPrompt()` (`ai/utils.ts`) copies prompt to clipboard, opens Perplexity in system browser via RPC (`api.shell.openExternal`). Backend calls `Utils.openExternal(url)` from `electrobun/bun`. Prompt appended as `?q=` URL param (sliced 6000 chars) for auto-fill. Full prompt on clipboard for long prompts. 6000 avoids HTTP 431 from URL + header size exceeding server/proxy limits.

## Lesson content section handling — regex detail

`extractSkillSection(content, label)` function (duplicated in both files): uses regex `/^## <label>[\s\S]*?(?=^## |\z)/m` to extract hint text between the heading and next section. `processLessonContent()` uses same pattern for removal/replacement.
