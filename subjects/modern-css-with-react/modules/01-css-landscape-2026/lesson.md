# Module 1: CSS Landscape 2026 — React Edition

Est. study time: 2.5h
Language: en

## Learning Objectives
- Map every major CSS approach in React and its 2026 status
- Evaluate approaches along 6 decision axes
- Select appropriate approach for a given React project context

---

## Core Content

### The 2026 CSS Approaches in React

Six major approaches exist. Each takes a different stance on where CSS lives, how it scopes, and what runs at runtime.

| Approach | Runtime cost | RSC compatible | Scoping | Popular in 2026 |
|----------|-------------|----------------|---------|-----------------|
| Plain CSS / Sass | None | Yes | Global / BEM | Mature codebases |
| CSS Modules | None | Yes | File-scoped | Next.js, Vite defaults |
| Tailwind CSS | Minimal (JIT) | Yes | Utility classes | Dominant new projects |
| Runtime CSS-in-JS | High | Partial | Component-scoped | Declining for new apps |
| Zero-runtime CSS-in-JS | None | Yes | Component-scoped | Rising (Vanilla Extract) |
| CSS with `@scope` | None | Yes | Scoped (native) | Emerging (Chrome 118+) |

> **Think**: A teammate proposes "let's use styled-components for our new Next.js app". What 3 questions should you ask before agreeing?
>
> *Answer: (1) Do we use RSC? styled-components needs client components. (2) What's our SSR story? styled-components has known hydration mismatch issues. (3) Team familiarity — is CSS-in-JS worth the bundle cost vs CSS Modules or Tailwind?*

### Decision Axes Framework

Every CSS approach decision reduces to tradeoffs along 6 axes:

**1. Runtime cost**

Runtime CSS-in-JS injects style tags at runtime. Each styled component call parses template literal → generates class → inserts into DOM. For an app with 200+ styled components, this means re-parsing CSS string on every client render.

Zero-runtime alternatives extract styles at build time. Vanilla Extract reads `.css.ts` files during build, outputs static `.css` files. RSC can stream these without JS.

> Example bundle impact:
> ```
> Runtime CSS-in-JS lib: ~12-15 kB gzip (styled-components/emotion runtime)
> Vanilla Extract: 0 kB runtime
> Tailwind: ~0.5 kB runtime (resets only)
> CSS Modules: 0 kB runtime
> ```

**2. RSC / Server Component compatibility**

React Server Components separate server-rendered components from client bundles. Any CSS approach that requires JavaScript to resolve styles is incompatible with RSC.
- CSS Modules, Tailwind, plain CSS: fully compatible — styles are static, resolved at build
- Runtime CSS-in-JS: requires `"use client"` — style injection only happens in browser
- Zero-runtime CSS-in-JS: compatible because no JS needed for styles

> **Think**: RSC-first app (Next.js App Router) — which approaches are eliminated?
>
> *Answer: Runtime CSS-in-JS (styled-components, Emotion) requires client boundary for every styled component, defeating RSC benefits. Tailwind, CSS Modules, Vanilla Extract work seamlessly.*

**3. Developer experience**

- Tailwind: fast iteration once class names memorized. No context-switching between files.
- CSS Modules: familiar CSS syntax, TypeScript autocomplete via `.module.css.d.ts`
- Runtime CSS-in-JS: dynamic styling via props natural (`color: ${p => p.$variant === 'danger' ? 'red' : 'blue'}`)
- Zero-runtime: TypeScript-first, typed styles, but requires `.css.ts` file per component

**4. Scoping & isolation**

- Plain CSS: global namespace — naming conventions needed (BEM, etc.)
- CSS Modules: automatically scoped — `styles.button` becomes unique `.Button_button_abc123`
- CSS-in-JS: automatic scoping via generated class names
- Tailwind: scoped to utility classes applied directly; no cascade conflicts
- `@scope`: native CSS scoping (`@scope(.card) { ... }`)

**5. Dynamic styling**

| Approach | Dynamic styles | Mechanism |
|----------|---------------|-----------|
| Plain CSS | Limited | Class toggling, inline styles |
| CSS Modules | Via class composition | `clsx(styles.base, isActive && styles.active)` |
| Tailwind | Via class composition | `clsx('text-base', isLarge && 'text-lg')` |
| Runtime CSS-in-JS | Native | Props → CSS template interpolation |
| Zero-runtime CSS-in-JS | Via vars/recipes | CSS custom properties + recipe variants |

**6. Bundle footprint**

- Plain CSS / CSS Modules: as authored
- Tailwind: purge unused utilities — typically 5-15 kB gzip
- Runtime CSS-in-JS: library runtime + all style strings in JS bundle
- Zero-runtime CSS-in-JS: extracted to CSS files, not in JS bundle

> **Think**: Your team ships a moderate React app (50 components). How would bundle sizes differ between (a) Tailwind, (b) CSS Modules, (c) styled-components?
>
> *Answer: (a) Tailwind: ~10 kB compressed CSS, <1 kB runtime. (b) CSS Modules: ~5-8 kB CSS, 0 kB runtime. (c) styled-components: ~14 kB runtime lib + authored CSS strings in JS bundle (~15-25 kB total gzip). For 50 components, runtime CSS-in-JS adds ~10-15 kB of library overhead beyond the styles themselves.*

### When Each Approach Wins

- **Plain CSS / Sass**: legacy project, strict design system already in CSS, team knows Sass well, no React-specific CSS needs
- **CSS Modules**: framework default (Next.js, Vite), zero-runtime, TypeScript support, team prefers standard CSS syntax
- **Tailwind**: rapid prototyping, team consistency via constraint system, design tokens built-in, utility-first
- **Runtime CSS-in-JS**: heavy dynamic styling, design system with hundreds of variants, team already uses and accepts tradeoffs. **Declining** for greenfield
- **Zero-runtime CSS-in-JS**: type-safe styles, design system needing build-time extraction, RSC-compatible, want CSS-in-JS syntax without runtime cost
- **`@scope`**: native scoping without tooling, new Chrome-only projects, supplement to other approaches

> **Think**: When would runtime CSS-in-JS still be the right choice in 2026?
>
> *Answer: Greenfield? Rare. But existing large styled-components/Emotion codebase: migration cost outweighs runtime cost. Also: electron apps with heavy dynamic theming where RSC compatibility irrelevant.*

---

### Why This Matters

Choosing wrong CSS approach costs months in refactoring. styled-components in an RSC app means you can't use server components with those components. Tailwind in a design system means consumers inherit utility-first DX. Plain CSS in a 50-component app cascades into specificity hell.

React in 2026 has moved toward RSC and server-first rendering. CSS decisions that don't account for this produce either runtime bloat or broken SSR.

---

### Common Questions

**Q: Can I mix approaches in one React app?**
A: Yes, and many do. Example: Tailwind for page layouts, CSS Modules for complex component states, small amount of global CSS for reset/fonts. Each serves a scope. Key rule: one approach per component — don't use styled-components + CSS Modules + inline styles in one file.

**Q: Is `@scope` the future that kills all other approaches?**
A: `@scope` gives native CSS scoping but doesn't solve dynamic styling, bundle optimization, or design token enforcement. It replaces naming conventions like BEM but not CSS Modules or CSS-in-JS entirely. More likely: `@scope` + Tailwind or `@scope` + Vanilla Extract becomes common.

**Q: Does Next.js or Vite recommend anything?**
A: Next.js defaults to CSS Modules (global CSS only in `layout.tsx`). Tailwind integration is first-class. Vite has built-in CSS Modules support. Both support plain CSS. Neither recommends runtime CSS-in-JS — it requires client components.

**Q: How do I decide which approach to use for each part of my app?**
A: Use the layer model: global foundation (reset, fonts, tokens) → layout (grid, flex) → component (variants, states) → overrides (per-page adjustments). Each layer can use a different approach. Global → plain CSS. Layout → Tailwind. Component → CSS Modules or Vanilla Extract. Overrides → inline styles or className props. Module 16 covers this in depth.

---

### Hybrid Strategy: How to Mix Approaches Effectively

A single CSS approach rarely fits every part of an app. The question isn't "which approach?" but "which approach for which layer?"

**The Layer Model:**

```
┌─────────────────────────────────┐
│  Layer 1: Global Foundation     │  ← Plain CSS / Sass
│  (reset, fonts, CSS vars,       │     One global file
│   keyframes, print styles)      │
├─────────────────────────────────┤
│  Layer 2: Layout & Structure    │  ← Tailwind utility classes
│  (grid, flex, spacing,          │     Fast, consistent,
│   responsive breakpoints)       │     design-constraint system
├─────────────────────────────────┤
│  Layer 3: Component Styles      │  ← CSS Modules / Vanilla Extract
│  (variants, states, animations, │     Scoped, zero runtime,
│   pseudo-elements, media qs)    │     type-safe variants
├─────────────────────────────────┤
│  Layer 4: Per-Instance Override │  ← className prop + twMerge
│  (one-off adjustments,          │     or inline style for
│   dynamic values from data)     │     truly dynamic values
└─────────────────────────────────┘
```

Each layer has different needs:
- **Global**: Browser reset, font-face declarations, CSS custom properties, animation keyframes — never changes per component
- **Layout**: Responsive grids, page structure, spacing systems — benefit from utility-first speed
- **Component**: Scoped styles with variants and states — need isolation and type safety
- **Override**: Per-use-case tweaks — escape hatch, not primary mechanism

**Concrete mixing patterns that work:**

| Pattern | Approaches | When | Example |
|---------|-----------|------|---------|
| Tailwind + CSS Modules | Tailwind for layout, CSS Modules for complex components | App with standard pages + interactive widgets | Dashboard grid (Tailwind), drag-drop list (CSS Modules) |
| Vanilla Extract + Tailwind | VE for component library, Tailwind for page composition | Design system consumed by Tailwind app | Button/Input library (VE), pages composing them (Tailwind) |
| Plain CSS + CSS Modules | Global foundation + scoped components | Legacy migration, app with heavy global styles | Reset/typography (CSS), product cards (Modules) |
| Zero-runtime + inline styles | Static styles in CSS-in-JS, dynamic values inline | Data visualization, progress bars | Chart container (VE), bar widths (inline style) |

**Pattern 1: Tailwind for layout, CSS Modules for components**

Most common in 2026. Tailwind handles the big structural decisions (grid columns, breakpoints, spacing). CSS Modules handle component-internal states (hover, active, disabled, variants).

```tsx
// Page layout uses Tailwind — fast, visible at a glance
function DashboardPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      <Sidebar className="lg:col-span-1" />
      <MainContent className="lg:col-span-2" />
    </div>
  );
}

// Complex component uses CSS Modules — isolated, variant-rich
// Sidebar.tsx
import styles from './Sidebar.module.css';
import clsx from 'clsx';

function Sidebar({ className }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside className={twMerge(styles.sidebar, collapsed && styles.collapsed, className)}>
      <nav>
        {items.map(item => (
          <a
            key={item.href}
            href={item.href}
            className={clsx(styles.navItem, item.active && styles.active)}
          >{item.label}</a>
        ))}
      </nav>
    </aside>
  );
}
```

Why this works: layout classes are few and structural (easy to read as Tailwind). Component classes are complex and stateful (benefit from isolation).

**Pattern 2: Vanilla Extract component library consumed by Tailwind app**

Design system authoring in VE (typed, zero runtime, theme contracts). Page composition in Tailwind (fast, no file switching).

```tsx
// Component library — Vanilla Extract
// Button.css.ts
export const button = recipe({
  base: { display: 'inline-flex', borderRadius: '6px' },
  variants: {
    variant: {
      primary: { background: 'var(--color-primary)', color: 'white' },
      outline: { background: 'transparent', border: '1px solid var(--color-primary)' },
    },
  },
});

// Consumer app — Tailwind
function LandingPage() {
  return (
    <div className="flex flex-col items-center gap-4 p-12">
      <h1 className="text-3xl font-bold">Welcome</h1>
      <Button variant="primary" className="mt-4">Get Started</Button>
    </div>
  );
}
```

**Pattern 3: Legacy Sass + new CSS Modules**

Incremental migration for established Sass codebases. Keep existing Sass styles where they work. Use CSS Modules for all new components. Shared tokens move to CSS custom properties.

```scss
// _tokens.scss → migrated to CSS custom properties
// Legacy: $color-primary: #0366d6;
// New: --color-primary: #0366d6;
```

```tsx
// Legacy component (Sass)
import './legacy-card.scss';
function LegacyCard({ children }) { return <div className="legacy-card">{children}</div>; }

// New component (CSS Modules)
import styles from './NewWidget.module.css';
function NewWidget() { return <div className={styles.widget}>...</div>; }
```

**What NOT to mix:**

| Bad combination | Why |
|----------------|-----|
| Runtime CSS-in-JS + Tailwind in same component | Two different class generation systems fighting for DOM — unpredictable specificity |
| CSS Modules + Sass `@extend` across files | Cross-file coupling that breaks isolation |
| Inline styles as primary styling mechanism | No media queries, no pseudo-classes, no cascade |
| Multiple approaches in one file | Reader must parse two styling paradigms in one component |

**Rule**: One approach per component file. Choose which approach fits the component's role (layout vs interactive vs presentational) and commit to it.

> **Think**: Your team uses Tailwind for everything. You're building a complex data table with sortable columns, resizable headers, row selection, and inline editing. The className string would be 30+ utilities. What do you do?
>
> *Answer: Extract the table into CSS Modules. Keep the page layout in Tailwind. The table component's internal complexity is isolated; the page structure stays fast and visible.*

---

### Use Case Decision Matrix

| App type | Recommended primary | Mix with | Why |
|----------|-------------------|----------|-----|
| SaaS dashboard (Next.js App Router) | Tailwind | CSS Modules for complex widgets | RSC-compatible, fast iteration, design consistency |
| Component library for 5+ apps | Vanilla Extract | CSS custom properties for themes | Zero runtime cost for consumers, type-safe API |
| Legacy Sass SPA migrating to Next.js | CSS Modules for new code | Keep Sass for migrated pages | Incremental migration, preserve existing tokens |
| Marketing site (static, 5 pages) | Tailwind or CSS Modules | Plain CSS for reset/fonts | Small scope, zero complexity overhead |
| Enterprise design system (50+ components) | Vanilla Extract | Sprinkles for atomic utilities | Type safety, theme contracts, zero runtime |
| Electron desktop app | Any | styled-components OK if team prefers | No SSR, no RSC, bundle size less critical |
| Rapid prototype / MVP | Tailwind | Inline styles for dynamic values | Speed > architecture, refactor later |
| Open-source component library | CSS Modules or Vanilla Extract | CSS custom properties for theming | Consumers shouldn't inherit your styling dependencies |

---

## Examples

### Example 1: Choosing for a SaaS dashboard

**Context**: New Next.js App Router app. 3 developers. 6-month timeline. Team knows React but not deep CSS.

Decision process:
1. RSC-first → eliminate runtime CSS-in-JS
2. Team speed → Tailwind gives fast iteration without CSS file management
3. Need custom design later → Tailwind config extensible

**Choice**: Tailwind + small CSS Modules for complex interactive widgets.

### Example 2: Choosing for a component library

**Context**: Shared component library consumed by 5 apps. TypeScript required. Explicit API surface.

Decision process:
1. No runtime — consumers have different app architectures
2. Type safety — typed style contracts
3. Theming — CSS custom properties for consumer customization

**Choice**: Vanilla Extract (zero-runtime, typed, themes as CSS variables).

### Example 3: Choosing for a legacy migration

**Context**: 200-page React SPA using Sass + BEM. Migrating to Next.js gradually.

Decision process:
1. Existing investment in Sass → reuse design tokens
2. Incremental migration → don't rewrite every component
3. New pages use RSC → need compatible approach

**Choice**: Keep Sass for migrated pages, use CSS Modules for new RSC components. Phase out Sass over 1 year.

---

## Key Takeaways
- Six main approaches: plain CSS, CSS Modules, Tailwind, runtime CSS-in-JS, zero-runtime CSS-in-JS, `@scope`
- Six decision axes: runtime cost, RSC compat, DX, scoping, dynamic styling, bundle
- Runtime CSS-in-JS declining for greenfield; RSC compatibility is the main driver
- Tailwind dominates new projects; Vanilla Extract rising for design systems
- Layer model: global → layout → component → override — each layer fits a different approach
- One approach per component file; mix across layers, not within components
- `@scope` (native scoping) is emerging but not yet replacing tooling
- Decision matrix: map app type to recommended approach + mixing strategy

---

## Common Misconception

**"I need CSS-in-JS to do dynamic styles in React."**

Not true. Dynamic styles in React are just class toggles or inline styles, regardless of CSS approach.

```tsx
// No CSS-in-JS needed — just class composition
function Button({ variant }) {
  return (
    <button className={clsx(
      styles.base,
      styles[variant as keyof typeof styles]
    )}>
      Click
    </button>
  );
}
```

CSS Modules + `clsx` achieves identical result to `styled('button')` with zero runtime cost. CSS-in-JS adds convenience (auto-prop-typing, theme access) but not capability.

---

## Feynman Explain
(Explain the six CSS approaches to a teammate who "just writes CSS in a file". Use simple terms. Say when you'd pick each. Don't use "runtime" or "RSC" until you explain what they mean.)

*When ready, say explanation aloud or write it down. Then run `learn.sh explain` — AI will probe your explanation for gaps.*

---

## Reframe
(Pause. Judge the decision framework: is "RSC compatibility" really the most important axis? For which apps would bundle size matter more? For which would team speed dominate?)

---

## Drill
Take the quiz. MCQs test approach recognition and tradeoff analysis.
