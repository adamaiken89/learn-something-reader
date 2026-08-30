import type { Highlight } from '../../bun/types';
import { logger } from '../logger';

type HastText = { type: 'text'; value: string };
export type HastElement = {
  type: 'element';
  tagName: string;
  properties?: Record<string, string>;
  children: HastNode[];
};
export type HastRoot = { type: 'root'; children: HastNode[]; [key: string]: unknown };
export type HastNode = HastText | HastElement | HastRoot | { type: string; [key: string]: unknown };

export const HIGHLIGHT_COLORS: Record<string, string> = {
  yellow: '#fbbf24',
  green: '#34d399',
  blue: '#60a5fa',
  pink: '#f472b6',
  orange: '#fb923c',
  purple: '#a78bfa',
  cyan: '#22d3ee',
  red: '#f87171',
  note: '#ef4444',
};

function makeMark(h: Highlight, text: string): HastElement {
  const isNote = h.color === 'note';
  return {
    type: 'element',
    tagName: 'mark',
    properties: {
      style: isNote
        ? `color: #ef4444; text-decoration: underline; text-decoration-color: #ef4444; text-underline-offset: 3px; cursor: pointer`
        : `background-color: ${HIGHLIGHT_COLORS[h.color] || h.color}; color: #1f2937; border-radius: 2px; padding: 0 2px`,
      dataHighlightId: h.id,
      ...(isNote ? { dataNoteId: h.id } : {}),
    },
    children: [{ type: 'text', value: text }],
  };
}

function isMermaidCode(el: HastElement): boolean {
  const cls = el.properties?.className;
  if (!cls) return false;
  const classes = Array.isArray(cls) ? cls : [cls];
  return classes.some((c) => typeof c === 'string' && c.includes('language-mermaid'));
}

function splitText(text: string, highlights: Highlight[]): HastNode[] {
  for (const h of highlights) {
    const trimmed = h.selectedText.trim();
    const idx = text.indexOf(trimmed);
    if (idx === -1) continue;

    const nodes: HastNode[] = [];
    if (idx > 0) nodes.push(...splitText(text.slice(0, idx), highlights));
    nodes.push(makeMark(h, trimmed));
    const remaining = text.slice(idx + trimmed.length);
    if (remaining) nodes.push(...splitText(remaining, highlights));
    return nodes;
  }
  return [{ type: 'text', value: text }];
}

function transformTree(node: HastElement, highlights: Highlight[], skip = false): void {
  if (!node?.children || !Array.isArray(node.children)) return;

  const newChildren: HastNode[] = [];
  for (const child of node.children) {
    if (child == null || typeof child !== 'object') {
      newChildren.push(child);
      continue;
    }
    if (child.type === 'text' && 'value' in child && typeof child.value === 'string' && !skip) {
      const parts = splitText(child.value, highlights);
      newChildren.push(...parts);
    } else {
      const el = child as HastElement;
      if (el.tagName === 'code' && isMermaidCode(el)) {
        newChildren.push(child);
        continue;
      }
      if (
        el.tagName === 'pre' &&
        el.children?.some(
          (c) => (c as HastElement).tagName === 'code' && isMermaidCode(c as HastElement),
        )
      ) {
        newChildren.push(child);
        continue;
      }
      const deeper = skip || el.tagName === 'mark' || el.tagName === 'blockquote';
      if ('children' in child && child.children != null) {
        transformTree(el, highlights, deeper);
      }
      newChildren.push(child);
    }
  }
  node.children = newChildren;
}

/** Concatenate all hast text, mirroring exactly what the offset `pos` counter
 * sees in applyHighlightsByOffset: mermaid code blocks are excluded (not
 * counted), everything else — including blockquotes and code — is counted. */
function collectFullText(children: HastNode[]): string {
  let out = '';
  const walk = (nodes: HastNode[]): void => {
    for (const child of nodes) {
      if (child == null || typeof child !== 'object') continue;
      if (child.type === 'text' && 'value' in child && typeof child.value === 'string') {
        out += child.value;
        continue;
      }
      const el = child as HastElement;
      if (el.tagName === 'code' && isMermaidCode(el)) continue;
      if (
        el.tagName === 'pre' &&
        el.children?.some(
          (c) => (c as HastElement).tagName === 'code' && isMermaidCode(c as HastElement),
        )
      ) {
        continue;
      }
      if (el.children && Array.isArray(el.children)) walk(el.children);
    }
  };
  walk(children);
  return out;
}

/** Whitespace-collapsed text plus two-way index maps to the original string. */
export interface NormalizedText {
  norm: string;
  /** norm index → original index. */
  map: number[];
  /** original index → norm index (length s.length + 1). */
  origToNorm: number[];
}

export function normalizeWithMap(s: string): NormalizedText {
  const chars: string[] = [];
  const map: number[] = [];
  const origToNorm: number[] = [];
  let lastWs = true;
  for (let i = 0; i < s.length; i++) {
    origToNorm[i] = chars.length;
    const ch = s[i];
    if (/\s/.test(ch)) {
      if (lastWs) continue;
      chars.push(' ');
      map.push(i);
      lastWs = true;
    } else {
      chars.push(ch);
      map.push(i);
      lastWs = false;
    }
  }
  origToNorm[s.length] = chars.length;
  // Trim leading/trailing collapsed whitespace, adjusting the norm→orig map.
  let lead = 0;
  let trail = chars.length;
  while (lead < trail && chars[lead] === ' ') lead++;
  while (trail > lead && chars[trail - 1] === ' ') trail--;
  return {
    norm: chars.slice(lead, trail).join(''),
    map: map.slice(lead, trail),
    origToNorm,
  };
}

/**
 * Validate offset-based highlights against the actual hast text and re-anchor
 * ones whose offsets drifted (course content edited after the highlight was
 * captured). A highlight whose `selectedText` no longer exists is dropped
 * (warned) instead of silently rendering marks at wrong positions.
 *
 * Comparison is whitespace-collapsed: DOM selections across block boundaries
 * contain newlines that hast text never has.
 */
export function resolveOffsets(fullText: string, highlights: Highlight[]): Highlight[] {
  const { norm, map, origToNorm } = normalizeWithMap(fullText);
  const out: Highlight[] = [];

  for (const h of highlights) {
    const selNorm = normalizeWithMap(h.selectedText).norm;
    if (selNorm === '') {
      out.push(h);
      continue;
    }
    const nStart = origToNorm[Math.min(h.startOffset, fullText.length)];
    const nEnd = origToNorm[Math.min(h.endOffset, fullText.length)];
    if (norm.slice(nStart, nEnd) === selNorm) {
      out.push(h);
      continue;
    }

    // Drifted — re-anchor to the nearest occurrence of the selected text.
    const candidates: number[] = [];
    let idx = norm.indexOf(selNorm);
    while (idx !== -1) {
      candidates.push(idx);
      idx = norm.indexOf(selNorm, idx + 1);
    }
    if (candidates.length === 0) {
      logger.warn({ id: h.id }, 'Highlight dropped: selected text no longer in content');
      continue;
    }
    const best = candidates.reduce((a, b) => (Math.abs(b - nStart) < Math.abs(a - nStart) ? b : a));
    const start = map[best];
    const end = map[best + selNorm.length - 1] + 1;
    out.push({ ...h, startOffset: start, endOffset: end });
    logger.warn({ id: h.id, startOffset: start }, 'Highlight re-anchored after content drift');
  }
  return out;
}

function applyHighlightsByOffset(node: HastElement, highlights: Highlight[]): void {
  if (!node?.children || !Array.isArray(node.children)) return;

  const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset);
  let pos = 0;

  function walk(children: HastNode[], skip: boolean): HastNode[] {
    const out: HastNode[] = [];

    for (const child of children) {
      if (child == null || typeof child !== 'object') {
        out.push(child);
        continue;
      }

      if (child.type === 'text' && 'value' in child && typeof child.value === 'string') {
        const textStart = pos;
        const textEnd = pos + child.value.length;
        pos = textEnd;

        if (skip) {
          out.push(child);
          continue;
        }

        const overlapping = sorted.filter(
          (h) => h.startOffset < textEnd && h.endOffset > textStart,
        );

        if (overlapping.length === 0) {
          out.push(child);
        } else {
          let cursor = 0;
          for (const h of overlapping) {
            const localS = Math.max(0, h.startOffset - textStart);
            const localE = Math.min(child.value.length, h.endOffset - textStart);
            if (localS > cursor)
              out.push({ type: 'text', value: child.value.slice(cursor, localS) });
            out.push(makeMark(h, child.value.slice(localS, localE)));
            cursor = localE;
          }
          if (cursor < child.value.length) {
            out.push({ type: 'text', value: child.value.slice(cursor) });
          }
        }
      } else {
        const el = child as HastElement;
        if (el.tagName === 'code' && isMermaidCode(el)) {
          out.push(child);
          continue;
        }
        if (
          el.tagName === 'pre' &&
          el.children?.some(
            (c) => (c as HastElement).tagName === 'code' && isMermaidCode(c as HastElement),
          )
        ) {
          out.push(child);
          continue;
        }
        const deeper = skip || el.tagName === 'mark' || el.tagName === 'blockquote';
        if (el.children && Array.isArray(el.children)) {
          el.children = walk(el.children, deeper);
        }
        out.push(child);
      }
    }

    return out;
  }

  node.children = walk(node.children, false);
}

export function rehypeHighlightText(highlights: Highlight[]) {
  return (tree: HastNode) => {
    if (highlights.length === 0) return;
    if (!tree || typeof tree !== 'object' || !('children' in tree)) return;

    const root = tree as HastElement;

    const offsetHighlights: Highlight[] = [];
    const textHighlights: Highlight[] = [];

    for (const h of highlights) {
      if (h.endOffset > 0) {
        offsetHighlights.push(h);
      } else {
        textHighlights.push(h);
      }
    }

    if (offsetHighlights.length > 0) {
      const fullText = collectFullText(root.children);
      applyHighlightsByOffset(root, resolveOffsets(fullText, offsetHighlights));
    }

    if (textHighlights.length > 0) {
      transformTree(root, textHighlights, false);
    }
  };
}
