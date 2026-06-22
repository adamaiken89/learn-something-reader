# Module 6: Tailwind CSS with React

Est. study time: 3h
Language: en

## Learning Objectives
- Configure Tailwind with Next.js and Vite
- Apply conditional Tailwind classes in JSX with clsx/tailwind-merge
- Abstract Tailwind into reusable React component patterns
- Understand Tailwind's tradeoffs at scale

---

## Core Content

### Tailwind JIT Engine

Tailwind v4 (2025+) uses a JIT (Just-In-Time) engine that scans source files and generates only the classes actually used.

```
Input: className="flex items-center gap-4 p-4 bg-blue-500"
Output CSS: only .flex, .items-center, .gap-4, .p-4, .bg-blue-500 (and their variants)
```

No unused CSS purge configuration needed — JIT is the default in v4.

**Key config file** (`tailwind.config.ts` or `app.css` in v4):

```css
/* app.css — Tailwind v4 */
@import "tailwindcss";

@theme {
  --color-primary: #0366d6;
  --color-danger: #d73a49;
}
```

This defines custom design tokens that become Tailwind utility classes: `bg-primary`, `text-primary`, `border-danger`.

```tsx
function Button() {
  return (
    <button className="bg-primary text-white px-4 py-2 rounded-md">
      Click
    </button>
  );
}
```

> **Think**: How does Tailwind JIT know which classes to generate?
>
> *Answer: It scans all source files for className strings matching utility patterns. If you construct class names dynamically (className={`bg-${color}`}), JIT can't see the full string → class may be missing. Use `safeList` or full class names.*

### Conditional Classes in JSX

In React, Tailwind classes are just strings in `className`. Conditionals use standard JavaScript:

```tsx
// Ternary
<button className={`px-4 py-2 ${isActive ? 'bg-blue-500' : 'bg-gray-200'}`}>
  Click
</button>

// clsx (preferred for readability)
<button className={clsx(
  'px-4 py-2 rounded-md',
  variant === 'primary' && 'bg-blue-500 text-white',
  variant === 'outline' && 'border border-blue-500 text-blue-500',
  disabled && 'opacity-50 cursor-not-allowed'
)}>
  Click
</button>
```

**Problem**: Tailwind classes conflict when combined. `px-4` and `px-6` both define `padding-left`/`padding-right`. The last one in the CSS file wins, which may not match your intent.

**Solution**: `tailwind-merge` resolves conflicting Tailwind classes:

```tsx
import { twMerge } from 'tailwind-merge';

function Button({ className, variant }) {
  return (
    <button className={twMerge(
      'px-4 py-2 rounded-md',
      variant === 'primary' && 'bg-blue-500 text-white',
      className  // Consumer's overrides win correctly
    )}>
      Click
    </button>
  );
}
```

Without `twMerge`: `className="px-4 px-6"` → whichever CSS rule appears last in the stylesheet wins (unpredictable).
With `twMerge`: `px-6` replaces `px-4` predictably.

> **Think**: Why can't CSS cascade handle conflicting Tailwind classes like it does in plain CSS?
>
> *Answer: Because all Tailwind utilities have equal specificity (each is one class). `px-4` and `px-6` have identical specificity → whichever appears later in the CSS file wins. CSS source order depends on JIT generation order, not your className string order.*

### Component Abstraction Patterns

Raw Tailwind in every JSX creates repetition. Three patterns extract reusable components:

**1. Simple wrapper (no abstraction)**

```tsx
function Button({ children }) {
  return (
    <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
      {children}
    </button>
  );
}
```

Pro: explicit, easy to see all styles. Con: duplicates for every variant.

**2. Variant map**

```tsx
const variants = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  ghost: 'bg-transparent text-blue-500 hover:bg-gray-100',
};

const sizes = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

function Button({ variant = 'primary', size = 'md', className, children }) {
  return (
    <button className={twMerge(
      'rounded-md font-medium transition-colors',
      variants[variant],
      sizes[size],
      className
    )}>
      {children}
    </button>
  );
}
```

**3. cva (class-variance-authority)** — variant factory:

```tsx
import { cva } from 'class-variance-authority';

const button = cva('rounded-md font-medium transition-colors', {
  variants: {
    variant: {
      primary: 'bg-blue-500 text-white hover:bg-blue-600',
      danger: 'bg-red-500 text-white hover:bg-red-600',
      ghost: 'bg-transparent text-blue-500 hover:bg-gray-100',
    },
    size: {
      sm: 'px-3 py-1 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});

function Button({ variant, size, className, children }) {
  return (
    <button className={twMerge(button({ variant, size }), className)}>
      {children}
    </button>
  );
}
```

`cva` gives type-safe variant props automatically.

### Custom Design Tokens

Tailwind's `@theme` directive (v4) maps to CSS custom properties internally:

```css
/* app.css */
@import "tailwindcss";
@theme {
  --color-brand: #6366f1;
  --color-brand-hover: #4f46e5;
  --font-display: "Inter", sans-serif;
  --radius-card: 12px;
}
```

These become: `bg-brand`, `text-brand`, `hover:bg-brand-hover`, `font-display`, `rounded-card`.

To extend rather than replace, use `--default-*`:

```css
@theme {
  --color-brand: #6366f1;
  --color-gray-50: #f8fafc;  /* Override default gray */
}
```

### RSC Compatibility

Tailwind is fully RSC-compatible. Class name strings are static — no runtime, no hooks.

```tsx
// Server component — works natively
export default function ProductList({ products }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(p => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
```

Next.js App Router has first-class Tailwind integration. Vite requires the Tailwind plugin.

### Tradeoffs at Scale

**Pro:**
- Zero runtime, RSC-compatible, small bundle (purged)
- Design consistency via constraint system
- Fast prototyping — no file switching
- Largest ecosystem (plugins, components, templates)

**Con:**
- Long `className` strings — readability suffers beyond ~5 utilities
- HTML/CSS coupling — separating concerns is impossible
- Custom designs limited to config-defined tokens
- Debugging: which utility causes this style? Check each in order
- Team must memorize utility names (or use autocomplete)

> **Think**: At what team size or component count does Tailwind become a readability problem?
>
> *Answer: Not team size — component complexity. A `<header>` with 15 utility classes is readable. A `<TableHeader>` with conditional sorting, resizing, sticky columns, and 8 interactive states in a single className string is not. Extract sub-components or use cva for complex states.*

### When NOT to Use Tailwind

Tailwind is dominant but not universal. These scenarios suggest a different approach:

**1. Complex interactive components (30+ className utilities)**

A data table with sortable columns, resizable headers, row selection, inline editing, and pagination produces className strings that are unreadable:

```tsx
// Realistic table header — unmaintainable as pure Tailwind
<th className={twMerge(
  'sticky top-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition-colors',
  sortable && 'cursor-pointer select-none',
  sorted === 'asc' && 'text-indigo-600 bg-indigo-50',
  sorted === 'desc' && 'text-indigo-600 bg-indigo-50',
  resizing && 'border-r-2 border-indigo-500',
  className
)}>
```

Solution: Extract into CSS Modules for the component's internal states. Keep page layout in Tailwind.

**2. Design systems distributed to external consumers**

If your component library ships to 5+ apps that use different styling approaches (Tailwind, CSS Modules, Vanilla Extract), Tailwind locks consumers into Tailwind. They must:
- Install Tailwind as a dependency
- Use Tailwind's config/theme system
- Accept Tailwind's purge/JIT pipeline

For distributed design systems, Vanilla Extract or CSS Modules are better — zero runtime, no framework lock-in.

**3. Heavy pseudo-element reliance (`::before`, `::after`)**

Tailwind's pseudo-element support is limited. Complex decorative elements (tooltip arrows, custom checkmarks, gradient overlays) are easier in CSS Modules or plain CSS.

**4. App with third-party CSS that Tailwind can't control**

If your app integrates a third-party UI kit (calendar, rich text editor, map) with its own CSS, Tailwind's reset may conflict. You need scoped CSS approaches to isolate third-party styles.

**5. Performance-critical animation sequences**

Tailwind's transition utilities cover simple cases (hover, focus). For cinematic animations with complex keyframes, staggered delays, and orchestrated sequences, writing raw CSS in CSS Modules or Vanilla Extract is more direct.

**Summary: Tailwind fits page-level composition best. Component-level complexity should use scoped CSS approaches.**

### Performance Concerns at Scale

**CSS file size growth:**

Tailwind JIT generates one CSS file. In a large app (200+ pages), this file contains all utilities used across the entire app — even if each page only uses 10% of them.

| App size | Tailwind CSS output | Per-page CSS (CSS Modules) |
|----------|-------------------|---------------------------|
| 10 pages | ~8 kB gzip | ~3-5 kB per page |
| 50 pages | ~15 kB gzip | ~3-5 kB per page |
| 200 pages | ~25-40 kB gzip | ~3-5 kB per page |

For small apps, Tailwind wins (one small CSS file). For large apps, CSS Modules win (per-page CSS smaller than Tailwind's cumulative file).

**Solution for large apps**: Split Tailwind into multiple entry points per route:

```css
/* app/page.css — per-route Tailwind */
@import "tailwindcss" source("./app/dashboard/");
```

Or combine: Tailwind for global design system, route-specific CSS Modules for per-page styles.

**Runtime class computation cost:**

In a React component, `twMerge(clsx(...))` runs on every render. For 1000 components on a page, that's 1000 function calls computing class strings. This is negligible (<1ms) but worth knowing for animation-heavy components (60fps).

```tsx
// Avoid in animation-heavy components:
function AnimatedItem({ active }) {
  // twMerge runs on every animation frame if parent re-renders
  return <div className={twMerge('transition-all', active && 'scale-110')} />;
}

// Better: compute class at state change, not during animation
function AnimatedItem({ active }) {
  const className = useMemo(
    () => twMerge('transition-all', active && 'scale-110'),
    [active]
  );
  return <div className={className} />;
}
```

**Readability breaking point:**

Empirical team reports suggest the breaking point for Tailwind readability is:
- **<10 utilities** per className: fine
- **10-20 utilities**: acceptable with twMerge + clsx
- **20+ utilities**: extract sub-component or switch to CSS Modules

If you find yourself writing className strings that span 3+ lines with conditional logic, the component is too complex for inline Tailwind.

> **Think**: Your app has 100 pages. Tailwind CSS output is 28 kB gzip. Each page uses ~8 kB of that. What's the performance optimization?
>
> *Answer: Split Tailwind generation per route segment. Or combine: use Tailwind for layout/global (10 kB), CSS Modules for page-specific components (5 kB/page). This way each page loads 10 kB (Tailwind) + 5 kB (page CSS) = 15 kB vs 28 kB.*

---

### Why This Matters

Tailwind is the dominant CSS approach for new React projects in 2026. Understanding its patterns (conditional classes, abstraction, twMerge, cva) is essential for working on modern React codebases. Its tradeoffs — readability at scale, debugging difficulty, coupling — determine whether it stays productive as the app grows.

---

### Common Questions

**Q: Can I mix Tailwind with CSS Modules?**
A: Yes. Tailwind for layout/utilities, CSS Modules for complex component states (animations, pseudo-elements). Next.js and Vite support both.

**Q: Does Tailwind work with Vanilla Extract or styled-components?**
A: Mixing approaches per-component. Not per-file. A component uses Tailwind OR Vanilla Extract, not both.

**Q: How do I handle responsive design in Tailwind?**
A: Prefix utilities: `md:flex`, `lg:grid-cols-3`, `xl:p-8`. Tailwind's breakpoints work via media queries, same as CSS Modules but inline.

---

## Examples

### Example 1: Responsive Card Grid

```tsx
function Dashboard() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {cards.map(card => (
        <div key={card.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
          <p className="mt-2 text-sm text-gray-600">{card.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example 2: Themed Button with cva

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

const button = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-slate-900 text-white hover:bg-slate-800',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        outline: 'border border-slate-200 bg-white hover:bg-slate-100',
        ghost: 'hover:bg-slate-100',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-8 text-lg',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
);

type ButtonProps = VariantProps<typeof button> & {
  className?: string;
  children: React.ReactNode;
};

function Button({ variant, size, className, children, ...props }: ButtonProps) {
  return (
    <button className={twMerge(button({ variant, size }), className)} {...props}>
      {children}
    </button>
  );
}
```

---

## Key Takeaways
- Tailwind JIT generates only used classes — minimal CSS bundle
- Conditional classes via clsx; conflict resolution via tailwind-merge
- Abstract reusable components with variant maps or cva
- Custom tokens via `@theme` directive map to Tailwind utilities
- Fully RSC-compatible — class strings, zero runtime
- Scale challenge: long className strings reduce readability; extract sub-components
- NOT for: complex interactive components (30+ utilities), distributed design systems, third-party CSS integration
- Performance: single CSS file grows with app pages — consider per-route CSS splitting above 50 pages
- Breaking point: 20+ utilities per className → extract or switch to CSS Modules

---

## Common Misconception

**"Tailwind produces bloated HTML with lots of class names."**

The HTML is larger, but the CSS is much smaller. A Tailwind site's CSS is typically 5-15 kB gzip vs 50-100 kB for hand-written CSS with similar coverage. The HTML size increase is negligible compared to the CSS reduction. Total page weight (HTML + CSS) is usually lower.

---

## Feynman Explain
(Explain Tailwind JIT to a traditional CSS developer. Why "writing styles in className" is different from inline styles. How purging works. Why utility classes produce smaller CSS.)

---

## Reframe
(Pause. Judge: Tailwind dominates new projects. Is this because it's genuinely better, or because of network effects? When does it fail?)

---

## Drill
Take the quiz. Questions cover JIT, conditional classes, cva, and tradeoffs.
