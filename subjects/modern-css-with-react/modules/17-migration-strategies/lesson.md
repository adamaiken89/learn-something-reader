# Module 17: Migration & Gradual Adoption Strategies

Est. study time: 2h
Language: en

## Learning Objectives
- Plan incremental migration between CSS approaches
- Implement coexistence patterns for dual CSS pipelines
- Extract design tokens into framework-agnostic CSS custom properties
- Manage team workflow during multi-phase CSS transitions

---

## Core Content

### Why Big-Bang CSS Rewrites Fail

Every "rewrite all styles in X" project shares the same failure pattern:

1. **Month 1**: Enthusiasm. Migration planned for "6 weeks."
2. **Month 3**: 30% done. Original estimate was wrong — every component has edge cases.
3. **Month 6**: 60% done. Business needs new features — now maintaining two CSS approaches indefinitely.
4. **Month 12**: Project abandoned. Old CSS still exists alongside new. Team morale down.

**Root cause**: CSS is coupled to component logic. You can't swap a component's styling approach without touching its JSX and testing its behavior. A "CSS migration" is actually a component migration.

> **Think**: Your team maintains 300 components using styled-components. The CTO wants to switch to Tailwind. What's the realistic timeline?
>
> *Answer: 6-12 months minimum. Each component needs: (1) rewrite CSS string to Tailwind classes, (2) remove styled() wrapper, (3) update any prop-based style logic, (4) remove ThemeProvider usage, (5) test visual regression. At 5 components per week with 1 dedicated dev, that's 60 weeks. Plan for 6-12 months with 2-3 devs part-time.*

### Incremental Migration: The Strangler Fig Pattern

The strangler fig pattern grows new architecture alongside old, gradually replacing pieces until nothing of the original remains.

```
Phase 1: Coexistence
┌─────────────────┬─────────────────┐
│   Old approach  │   New approach  │
│  (styled-comps) │  (CSS Modules)  │
│                 │                 │
│  Button.tsx     │  Dashboard.tsx  │  ← Old and new files coexist
│  Card.tsx       │  Chart.tsx      │
│  Nav.tsx        │  Settings.tsx   │
└─────────────────┴─────────────────┘

Phase 2: Replacement (opportunistic)
┌─────────────────┬─────────────────┐
│   Old approach  │   New approach  │
│                 │                 │
│  Button.tsx ──► │  Button.tsx     │  ← Replaced during feature work
│  Card.tsx       │  Dashboard.tsx  │
│  Nav.tsx        │  Chart.tsx      │
│                 │  Settings.tsx   │
└─────────────────┴─────────────────┘

Phase 3: Cleanup
┌──────────────────────────────────┐
│          New approach            │
│                                  │
│  Button.tsx    Dashboard.tsx     │  ← Zero old imports
│  Card.tsx      Chart.tsx         │
│  Nav.tsx       Settings.tsx      │
└──────────────────────────────────┘
```

**Rule**: Never migrate a component unless you're already touching it for a feature or bug fix. "Style-only" migrations create work with zero user-facing value.

> **Think**: A component hasn't been touched in 2 years. It still uses styled-components. Should you migrate it?
>
> *Answer: No. If it works and no feature requires changing it, the migration has negative ROI. The runtime cost of one component is negligible. Migrate it when you add a feature or fix a bug.*

### Coexistence Patterns

When two CSS approaches run in the same app, they must coexist without conflict:

**Pattern 1: Side-by-side file imports**

Old and new components coexist in the same app. Old components import their approach independently. New components use the modern approach. No file mixes them.

```tsx
// Old component — unchanged
import styled from 'styled-components';
const Button = styled.button`padding: 8px;`;

// New component — uses different approach
import styles from './Card.module.css';
function Card() { return <div className={styles.card}>...</div>; }
```

**Pattern 2: Wrapper boundaries**

When old component is inside new component (or vice versa), use CSS custom properties as the boundary layer:

```tsx
// New layout component (Tailwind) wraps old component (styled-components)
function DashboardPage() {
  return (
    <div className="grid grid-cols-3 gap-4 p-6">
      {/* Old styled-components chart — works inside Tailwind grid */}
      <LegacyChart />
    </div>
  );
}
```

Tailwind sets layout. Old component handles its own internal styles. No conflict because Tailwind targets layout divs, not chart internals.

**Pattern 3: Shared design tokens via CSS custom properties**

Both old and new read from the same CSS custom properties:

```css
/* Global tokens — both approaches read these */
:root {
  --color-primary: #6366f1;
  --space-md: 16px;
}
```

```tsx
// Old styled-components
const Button = styled.button`
  background: var(--color-primary);
  padding: var(--space-md);
`;

// New CSS Modules
.button { background: var(--color-primary); padding: var(--space-md); }
```

Same tokens, different approaches. Changes flow through CSS custom properties.

**Pattern 4: Build pipeline coexistence**

Both approaches must compile simultaneously:

| Combination | Build setup | Complexity |
|-------------|-------------|------------|
| styled-components + CSS Modules | Both supported by default in Next.js/Vite | Low |
| styled-components + Tailwind | Both supported; Tailwind JIT scans all files | Low |
| CSS Modules + Sass | Next.js/Vite support both natively | Low |
| Vanilla Extract + Tailwind | VE plugin + Tailwind plugin | Medium |
| All four above | Multiple plugins, potential conflict | High |

Most frameworks support the common combinations. Test that both produce correct output in dev and production builds.

> **Think**: You add Vanilla Extract to an existing Next.js app using CSS Modules. What could break?
>
> *Answer: (1) VE requires a webpack/Vite plugin — ensure it doesn't conflict with existing CSS handling. (2) VE's class name generation might collide with CSS Module hashes (unlikely but test). (3) Build time increases because VE executes .css.ts files in Node. (4) Production CSS output now contains both VE-generated and CSS Module-generated files — verify ordering.*

### Design Token Extraction Strategy

Before migrating any component, extract shared design tokens from the old approach. This decouples visual values from implementation.

**Step 1: Audit existing tokens**

Search the old codebase for repeated values:

```typescript
// Find all hardcoded colors, spacing, fonts in styled-components:
// background: '#0366d6' appears in 47 components
// padding: '16px' appears in 89 components
// border-radius: '8px' appears in 32 components
```

**Step 2: Define as CSS custom properties**

```css
/* globals.css — new token system */
:root {
  --color-primary: #0366d6;
  --color-primary-hover: #0256b3;
  --color-danger: #d73a49;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --font-size-body: 16px;
  --font-size-heading: 24px;
}
```

**Step 3: Update old components to use CSS vars (optional)**

Old styled-components can reference the same vars:

```tsx
// Before: hardcoded value
const Button = styled.button`background: #0366d6;`;

// After: reads from CSS custom property
const Button = styled.button`background: var(--color-primary);`;
```

This step is optional — only do it if you plan to keep old components long-term. Otherwise, wait until migration to update.

**Step 4: New components use tokens via their approach**

```tsx
// Tailwind: @theme { --color-primary: var(--color-primary); }
// Then: bg-primary

// CSS Modules: background: var(--color-primary);

// Vanilla Extract: backgroundColor: themeVars.color.primary
```

> **Think**: What's the single most important migration step?
>
> *Answer: Extract design tokens to CSS custom properties FIRST. This decouples visual values from implementation. Once tokens are in CSS vars, old and new approaches read from the same source. Changing a color value updates both systems simultaneously. Everything else (component migration) is mechanical.*

### Migration Paths: Common Scenarios

**Path A: styled-components → CSS Modules**

```
Timeline: 6-12 months for 300 components

1. Month 1: Extract tokens to CSS custom properties
2. Month 1-3: New components use CSS Modules (stop growth of old system)
3. Month 3-9: Replace leaf components during feature work
   a. Convert styled.button → CSS Module + JSX button
   b. Move variant logic from ${p => ...} to clsx()
   c. Replace ThemeProvider references with CSS var references
4. Month 9-12: Replace parent components
5. Month 12: Remove styled-components dependency when zero imports remain
```

**Path B: Sass/plain CSS → Tailwind**

```
Timeline: 3-6 months for 200-page site

1. Month 1: Set up Tailwind alongside existing Sass
2. Month 1-3: New pages use Tailwind only
3. Month 3-6: During redesigns, convert old Sass pages to Tailwind
4. Month 6: Remove Sass dependency when zero .scss files remain
```

**Path C: Sass → CSS Modules (with Tailwind optional)**

```
Timeline: 4-8 months for 100 components

1. Month 1: Convert global Sass tokens to CSS custom properties
2. Month 1-2: New components use CSS Modules
3. Month 2-6: Rewrite active components to CSS Modules during features
4. Month 6-8: Clean up dead Sass files
5. Optionally add Tailwind for layout components
```

**Path D: Vanilla Extract → Tailwind (rare)**

```
Timeline: 2-4 months for 50 components

1. Month 1: New layout components use Tailwind
2. Month 1-3: Rewrite VE components that benefit from faster iteration
3. Keep VE for design system / typed components — Tailwind for pages
4. Result is often hybrid, not full migration
```

> **Think**: Your team chooses Path A (styled-components → CSS Modules). What's the first component you migrate?
>
> *Answer: A leaf component (no children) with simple styles and no ThemeProvider usage. A Button or Badge component. Success gives confidence, and the risk is low. Never start with a complex parent component like a Table or Form.*

### Team Workflow During Migration

**Rules for a smooth migration:**

1. **No "CSS migration" tickets** — always pair migration with feature work: "Add export button (and while touching Button, convert to CSS Modules)"
2. **Track percentage, not deadlines** — "70% of components converted" (measurable) vs "Done by June" (guess)
3. **One person, one approach** — don't let a dev learn two new CSS approaches simultaneously
4. **Visual regression testing** — before/after screenshots for every migrated component
5. **Acres of diamonds** — look at what the old approach does WELL before replacing. If styled-components' dynamic theming is genuinely useful, keep it until you have a CSS custom property alternative

**Migration readiness checklist:**

```
Before migration sprint:
□ Design tokens extracted to CSS custom properties
□ New approach build pipeline proven in production
□ Team trained on new approach (2-5 small components)
□ Visual regression testing in place
□ Leaf components identified (low-risk starters)
□ "No new old-approach components" rule enforced

During migration:
□ One component per ticket (never batch)
□ Before/after screenshot in PR
□ Remove old import when zero references remain
□ Track converted/total ratio weekly
```

---

### Common Questions

**Q: Should I ever do a full rewrite of all CSS?**
A: Almost never. CSS rewrites are like moving your house by rebuilding it while living in it — possible but painful. The strangler fig pattern (gradual replacement) has lower risk and delivers value incrementally.

**Q: How do I prevent new components from using the old approach during migration?**
A: Enforce via linting. Add an ESLint rule that warns on `import from 'styled-components'` in new files. Document the new approach with code examples. In code review, reject new old-approach usage.

**Q: What about the old approach's build pipeline?**
A: Keep it running during migration. Remove it when:
- Zero imports of the old approach remain in the source
- Zero CI scripts reference it
- Zero documentation references it
- Zero team members still use it for new work

Removing too early blocks migration. Removing too late creates confusion.

**Q: Can I use codemods for migration?**
A: For simple cases (rename `styled.button` → CSS Module), yes. For anything involving variant logic prop interpolation, codemods produce fragile output. Manual migration is safer for complex components.

---

## Examples

### Example 1: Incremental styled-components → CSS Modules

**Before:**
```tsx
// Button.tsx — styled-components
import styled, { css } from 'styled-components';

const variants = {
  primary: css`background: #0366d6; color: white;`,
  outline: css`background: transparent; border-color: #0366d6;`,
};

const StyledButton = styled.button<{ $variant?: keyof typeof variants }>`
  display: inline-flex;
  padding: 8px 16px;
  border-radius: 6px;
  ${p => p.$variant && variants[p.$variant]}
`;

function Button({ variant, children }) {
  return <StyledButton $variant={variant}>{children}</StyledButton>;
}
```

**After:**
```tsx
// Button.tsx — CSS Modules
import styles from './Button.module.css';
import clsx from 'clsx';

function Button({ variant = 'primary', children }) {
  return (
    <button className={clsx(
      styles.button,
      variant === 'primary' && styles.primary,
      variant === 'outline' && styles.outline,
    )}>
      {children}
    </button>
  );
}
```

```css
/* Button.module.css */
.button {
  display: inline-flex;
  padding: 8px 16px;
  border-radius: 6px;
}
.primary { background: var(--color-primary); color: white; }
.outline { background: transparent; border-color: var(--color-primary); }
```

**Migration steps:**
1. Create `Button.module.css` with the same styles (using CSS vars)
2. Rewrite `Button.tsx` to import CSS Module, remove styled imports
3. Test visual regression
4. Remove old imports (none if Button was the last styled-components user)

### Example 2: Dual Build Pipeline

```tsx
// next.config.ts — supporting styled-components + CSS Modules during migration
const nextConfig = {
  compiler: {
    styledComponents: true,  // Keep for old components
  },
};

// tailwind.config.ts — adding Tailwind alongside existing stack
export default {
  content: ['./src/**/*.{tsx,ts}'],
  plugins: [],
};
```

No conflict — Next.js handles CSS Modules natively, styled-components via compiler option, and Tailwind via content scanning. All three coexist.

---

## Key Takeaways
- Big-bang CSS rewrites fail — use the strangler fig pattern (incremental replacement)
- Never migrate a component unless touching it for a feature or bug fix
- Extract design tokens to CSS custom properties FIRST — this decouples values from implementation
- Coexistence patterns: side-by-side files, wrapper boundaries, shared tokens, dual build pipeline
- Visual regression testing before/after every migrated component
- Track percentage, not deadlines — "70% converted" over "done by June"
- Lint against new old-approach usage during migration
- Remove old approach when zero imports remain

---

## Common Misconception

**"We need to finish the migration before shipping new features."**

False. You can (and should) ship features while migrating. The strangler fig pattern adds new-feature components in the new approach. Old components stay until they need changes. This means:
- New features use modern CSS
- Old features stay stable
- Migration costs are amortized over feature work
- Business value is delivered continuously

Stop the migration if it's blocking features. Resume when it can be paired with feature work again. Incomplete migration with zero new old-style components is a success state, not a failure.

---

## Feynman Explain
(Explain the strangler fig migration pattern to a product manager. Why is gradual replacement safer than a rewrite? How does it deliver value during migration, not just after?)

---

## Reframe
(Pause. Judge: When WOULD a full rewrite of CSS be justified? Are there cases where the old approach is so broken that incremental migration is impossible? What makes a codebase "un-strangler-able"?)

---

## Drill
Take the quiz. Questions cover migration phases, coexistence patterns, token extraction strategy, and team workflow.
