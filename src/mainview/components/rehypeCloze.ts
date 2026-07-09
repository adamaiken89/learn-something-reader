/**
 * Rehype plugin for active recall mode.
 *
 * 1. Transforms {term} patterns into interactive cloze blanks
 * 2. Wraps Cloze/Predict/Spot-the-Mistake blockquotes in <details> elements
 */
import type { HastElement, HastNode } from './rehypeHighlightText';

function isBlockquote(node: HastNode): node is HastElement {
  return (
    node.type === 'element' &&
    (node as HastElement).tagName === 'blockquote' &&
    Array.isArray((node as HastElement).children)
  );
}

function findStrongText(nodes: HastNode[]): string | null {
  for (const n of nodes) {
    if (n.type === 'element' && (n as HastElement).tagName === 'strong') {
      const el = n as HastElement;
      if (el.children?.length && el.children[0].type === 'text') {
        return (el.children[0] as { value: string }).value.toLowerCase();
      }
    }
  }
  return null;
}

function transformClozeText(text: string): HastNode[] {
  const regex = /\{([^}]+)\}/g;
  let last = 0;
  const nodes: HastNode[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push({ type: 'text', value: text.slice(last, match.index) });
    }
    nodes.push({
      type: 'element',
      tagName: 'span',
      properties: {
        className: 'cloze-blank',
        dataAnswer: match[1],
      },
      children: [{ type: 'text', value: match[1] }],
    });
    last = regex.lastIndex;
  }
  if (last < text.length) {
    nodes.push({ type: 'text', value: text.slice(last) });
  }
  return nodes.length > 0 ? nodes : [{ type: 'text', value: text }];
}

function walkAndTransformCloze(node: HastNode): HastNode {
  if (node.type === 'text' && 'value' in node) {
    const text = (node as { value: string }).value;
    if (/\{[^}]+\}/.test(text)) {
      return {
        type: 'element',
        tagName: 'span',
        properties: {},
        children: transformClozeText(text),
      } as HastNode;
    }
  }
  if ((node as HastElement).children && Array.isArray((node as HastElement).children)) {
    const el = node as HastElement;
    // Skip code blocks
    if (el.tagName === 'code' || el.tagName === 'pre') return node;
    el.children = el.children.map(walkAndTransformCloze);
  }
  return node;
}

function wrapInteractiveBlock(bq: HastElement): HastElement {
  // Check first <p>'s <strong> text
  const firstP = bq.children.find(
    (c) => c.type === 'element' && (c as HastElement).tagName === 'p',
  ) as HastElement | undefined;
  if (!firstP) return bq;

  const label = findStrongText(firstP.children);
  if (!label || (label !== 'cloze' && label !== 'predict' && label !== 'spot the mistake')) {
    return bq;
  }

  // Find answer line
  let answerNode: HastNode | null = null;
  const contentNodes: HastNode[] = [];
  for (const c of bq.children) {
    if (c.type === 'element' && (c as HastElement).tagName === 'p') {
      const p = c as HastElement;
      const em = p.children?.find(
        (pc) => pc.type === 'element' && (pc as HastElement).tagName === 'em',
      );
      if (em) {
        const emText = (em as HastElement).children?.[0];
        if (
          emText?.type === 'text' &&
          (emText as { value: string }).value.toLowerCase().startsWith('answer')
        ) {
          answerNode = c;
          continue;
        }
      }
    }
    contentNodes.push(c);
  }

  // For cloze: keep blockquote format, just hide answer line
  if (label === 'cloze') {
    return {
      ...bq,
      children: contentNodes,
    } as HastElement;
  }

  // For predict/spot the mistake: wrap in <details>
  const summaryLabel = label === 'predict' ? '🔮 Predict' : '⚠️ Spot the Mistake';

  return {
    type: 'element',
    tagName: 'details',
    properties: { className: `interactive-block interactive-${label.replace(/\s+/g, '-')}` },
    children: [
      {
        type: 'element',
        tagName: 'summary',
        properties: {},
        children: [{ type: 'text', value: `${summaryLabel}: Try to recall before revealing` }],
      },
      {
        type: 'element',
        tagName: 'div',
        properties: { className: 'interactive-block-content' },
        children: [
          ...contentNodes,
          ...(answerNode
            ? [
                {
                  type: 'element',
                  tagName: 'div',
                  properties: { className: 'interactive-answer' },
                  children: [answerNode],
                } as HastNode,
              ]
            : []),
        ],
      },
    ],
  } as HastElement;
}

export function rehypeCloze() {
  return (tree: HastNode) => {
    if (!tree || !('children' in tree)) return;

    const root = tree as HastElement;
    const transformed: HastNode[] = [];

    for (const child of root.children) {
      // First walk text nodes for cloze patterns
      const processed = walkAndTransformCloze(child);

      // Then check for blockquotes that need wrapping
      if (isBlockquote(processed)) {
        transformed.push(wrapInteractiveBlock(processed));
      } else {
        transformed.push(processed);
      }
    }

    root.children = transformed;
  };
}
