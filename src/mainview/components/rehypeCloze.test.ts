import { describe, expect, test } from 'bun:test';

import { rehypeCloze } from './rehypeCloze';
import type { HastElement, HastNode, HastRoot } from './rehypeHighlightText';

function h(tagName: string, children: HastNode[], props?: Record<string, string>): HastElement {
  return { type: 'element' as const, tagName, properties: props, children };
}

function text(value: string): HastNode {
  return { type: 'text', value };
}

function root(children: HastNode[]): HastRoot {
  return { type: 'root', children };
}

describe('rehypeCloze', () => {
  test('transforms {term} into cloze span', () => {
    const tree = root([h('p', [text('A {discount} bond pays face value')])]);
    rehypeCloze()(tree);
    const p = tree.children[0] as HastElement;
    const span = p.children[0] as HastElement;
    // walkAndTransformCloze wraps text node in span
    expect(span.tagName).toBe('span');
    const innerSpan = (span.children?.find((c) => (c as HastElement).tagName === 'span') ??
      span.children?.[0]) as HastElement;
    // Check that at least one inner element is cloze-blank
    const clozeEl = innerSpan?.children?.find(
      (c) => (c as HastElement).properties?.className === 'cloze-blank',
    ) as HastElement;
    if (clozeEl) {
      expect(clozeEl.properties?.dataAnswer).toBe('discount');
    }
  });

  test('leaves text without braces unchanged', () => {
    const tree = root([h('p', [text('Normal text without cloze')])]);
    rehypeCloze()(tree);
    const p = tree.children[0] as HastElement;
    const firstChild = p.children[0] as { type: string; value?: string };
    if ('value' in firstChild) {
      expect(firstChild.value).toBe('Normal text without cloze');
    }
  });

  test('multiple cloze in same text', () => {
    const tree = root([h('p', [text('{Term1} and {Term2} both matter')])]);
    rehypeCloze()(tree);
    const p = tree.children[0] as HastElement;
    const wrapper = p.children[0] as HastElement;
    const clozeSpans = wrapper.children?.filter(
      (c) => (c as HastElement).properties?.className === 'cloze-blank',
    ) as HastElement[] | undefined;
    expect(clozeSpans).toHaveLength(2);
    expect(clozeSpans![0]?.properties?.dataAnswer).toBe('Term1');
    expect(clozeSpans![1]?.properties?.dataAnswer).toBe('Term2');
  });

  test('keeps Cloze blockquote as blockquote with answer hidden', () => {
    const bq = h('blockquote', [
      h('p', [h('strong', [text('Cloze')]), text(': ')]),
      h('p', [text('The ___ is X')]),
      h('p', [h('em', [text('Answer')]), text(': discount')]),
    ]);
    const tree = root([bq]);
    rehypeCloze()(tree);
    const result = tree.children[0] as HastElement;
    expect(result.tagName).toBe('blockquote');
    // Answer line should be removed
    const hasAnswer = result.children?.some((c) => {
      const p = c as HastElement;
      return (
        p.tagName === 'p' &&
        p.children?.some((pc) => {
          const em = pc as HastElement;
          return (
            em.tagName === 'em' &&
            em.children?.[0] &&
            (em.children[0] as { value?: string }).value?.toLowerCase() === 'answer'
          );
        })
      );
    });
    expect(hasAnswer).toBe(false);
  });

  test('wraps Predict blockquote in details', () => {
    const bq = h('blockquote', [
      h('p', [h('strong', [text('Predict')]), text(': What happens?')]),
      h('p', [text('Context...')]),
      h('p', [h('em', [text('Answer')]), text(': Price rises')]),
    ]);
    const tree = root([bq]);
    rehypeCloze()(tree);
    const details = tree.children[0] as HastElement;
    expect(details.tagName).toBe('details');
  });

  test('wraps Spot the Mistake blockquote in details', () => {
    const bq = h('blockquote', [
      h('p', [h('strong', [text('Spot the Mistake')]), text(': Scenario')]),
      h('p', [text('Wrong analysis...')]),
      h('p', [h('em', [text('Answer')]), text(': Error is X')]),
    ]);
    const tree = root([bq]);
    rehypeCloze()(tree);
    const details = tree.children[0] as HastElement;
    expect(details.tagName).toBe('details');
  });

  test('skips non-interactive blockquotes', () => {
    const bq = h('blockquote', [h('p', [h('strong', [text('Note')]), text(': Regular note')])]);
    const tree = root([bq]);
    rehypeCloze()(tree);
    const first = tree.children[0] as HastElement;
    expect(first.tagName).toBe('blockquote');
  });

  test('skips code blocks', () => {
    const tree = root([h('pre', [h('code', [text('{this} <- not a cloze')])])]);
    rehypeCloze()(tree);
    const pre = tree.children[0] as HastElement;
    expect(pre.tagName).toBe('pre');
  });

  test('Predict blockquote wraps in details with summary', () => {
    const bq = h('blockquote', [
      h('p', [h('strong', [text('Predict')]), text(': test')]),
      h('p', [h('em', [text('Answer')]), text(': test')]),
    ]);
    const tree = root([bq]);
    rehypeCloze()(tree);
    const details = tree.children[0] as HastElement;
    expect(details.tagName).toBe('details');
    const summary = details.children?.[0] as HastElement;
    expect(summary.tagName).toBe('summary');
    const summaryText = summary.children?.[0] as { value?: string };
    expect(summaryText.value).toContain('Predict');
  });

  test('handles empty root gracefully', () => {
    const tree = root([]);
    rehypeCloze()(tree);
    expect(tree.children).toHaveLength(0);
  });

  test('handles null/undefined root gracefully', () => {
    const tree = root([]);
    rehypeCloze()(tree);
    expect(tree).toBeDefined();
  });

  test('Predict answer hidden inside interactive-answer div', () => {
    const bq = h('blockquote', [
      h('p', [h('strong', [text('Predict')]), text(': Q?')]),
      h('p', [h('em', [text('Answer')]), text(': A!')]),
    ]);
    const tree = root([bq]);
    rehypeCloze()(tree);
    const details = tree.children[0] as HastElement;
    expect(details.tagName).toBe('details');
    const contentDiv = details.children?.[1] as HastElement;
    const answerDiv = contentDiv.children?.find(
      (c) => (c as HastElement).properties?.className === 'interactive-answer',
    );
    expect(answerDiv).toBeDefined();
  });

  test('Cloze blockquote with {term} blanks: answer hidden, blanks present', () => {
    // Exact format from lesson.md:
    // > **Cloze**: "Information enters through {sensory memory}, but only what we {attend to} passes into {working memory}."
    // >
    // > *Answer: sensory memory, attend to, working memory*
    const bq = h('blockquote', [
      h('p', [
        h('strong', [text('Cloze')]),
        text(
          ': "Information enters through {sensory memory}, but only what we {attend to} passes into {working memory}."',
        ),
      ]),
      h('p', [h('em', [text('Answer')]), text(': sensory memory, attend to, working memory')]),
    ]);
    const tree = root([bq]);
    rehypeCloze()(tree);
    const result = tree.children[0] as HastElement;

    // Should remain a blockquote (not details)
    expect(result.tagName).toBe('blockquote');

    // Answer line should be removed
    const hasAnswer = result.children?.some((c) => {
      const p = c as HastElement;
      return (
        p.tagName === 'p' &&
        p.children?.some((pc) => {
          const em = pc as HastElement;
          return (
            em.tagName === 'em' &&
            em.children?.[0] &&
            (em.children[0] as { value?: string }).value?.toLowerCase() === 'answer'
          );
        })
      );
    });
    expect(hasAnswer).toBe(false);

    // Find all cloze-blank spans anywhere in the result
    const findClozeBlanks = (node: HastNode): HastElement[] => {
      const blanks: HastElement[] = [];
      if ((node as HastElement).properties?.className === 'cloze-blank') {
        blanks.push(node as HastElement);
      }
      if ((node as HastElement).children) {
        for (const child of (node as HastElement).children) {
          blanks.push(...findClozeBlanks(child));
        }
      }
      return blanks;
    };

    const clozeBlanks = findClozeBlanks(result);
    expect(clozeBlanks.length).toBe(3);
    expect(clozeBlanks[0].properties?.dataAnswer).toBe('sensory memory');
    expect(clozeBlanks[1].properties?.dataAnswer).toBe('attend to');
    expect(clozeBlanks[2].properties?.dataAnswer).toBe('working memory');
  });
});
