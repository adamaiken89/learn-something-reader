import { describe, expect, test } from 'bun:test';

import type { Section } from '../../../bun/types';
import { findSectionIdForHighlight, scrollToHighlightEl } from './notesHelpers';

function makeSection(id: string, heading: string): Section {
  return { id, heading } as Section;
}

describe('notesHelpers', () => {
  describe('scrollToHighlightEl', () => {
    test('returns false when ref has no current', () => {
      expect(scrollToHighlightEl({ current: null }, 'h1')).toBe(false);
    });

    test('returns false when highlight element not found', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);
      const result = scrollToHighlightEl({ current: div }, 'missing');
      expect(result).toBe(false);
    });

    test('scrolls and returns true when found', () => {
      const div = document.createElement('div');
      div.innerHTML = '<mark data-highlight-id="h1">text</mark>';
      document.body.appendChild(div);

      const el = div.querySelector('mark')!;
      el.getBoundingClientRect = () =>
        ({
          top: 300,
          left: 0,
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect;
      div.getBoundingClientRect = () =>
        ({
          top: 50,
          left: 0,
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect;
      Object.defineProperty(div, 'scrollTop', { value: 100, configurable: true, writable: true });

      const result = scrollToHighlightEl({ current: div }, 'h1');
      expect(result).toBe(true);
      expect(div.scrollTop).toBe(300 - 50 + 100 - 60);
    });
  });

  describe('findSectionIdForHighlight', () => {
    const sections = [makeSection('s1', 'Intro'), makeSection('s2', 'Core')];

    test('returns null when ref has no current', () => {
      expect(findSectionIdForHighlight({ current: null }, 'h1', sections)).toBeNull();
    });

    test('returns null when highlight not found', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);
      expect(findSectionIdForHighlight({ current: div }, 'missing', sections)).toBeNull();
    });

    test('returns section by id when previous heading has id', () => {
      const div = document.createElement('div');
      div.innerHTML = '<h2 id="s1">Intro</h2><p><mark data-highlight-id="h1">x</mark></p>';
      document.body.appendChild(div);
      const result = findSectionIdForHighlight({ current: div }, 'h1', sections);
      expect(result).toEqual({ id: 's1', heading: 'Intro' });
    });

    test('falls back to heading text match when no id', () => {
      const div = document.createElement('div');
      div.innerHTML = '<h2>Core</h2><p><mark data-highlight-id="h2">x</mark></p>';
      document.body.appendChild(div);
      const result = findSectionIdForHighlight({ current: div }, 'h2', sections);
      expect(result?.heading).toBe('Core');
      expect(result?.id).toBe('s2');
    });

    test('returns null when no preceding heading found before container', () => {
      const div = document.createElement('div');
      div.innerHTML = '<p><mark data-highlight-id="h1">x</mark></p>';
      document.body.appendChild(div);
      expect(findSectionIdForHighlight({ current: div }, 'h1', sections)).toBeNull();
    });

    test('walks up parent when no prev sibling at current node', () => {
      const div = document.createElement('div');
      div.innerHTML =
        '<h2 id="s1">Intro</h2><div><span><mark data-highlight-id="h1">x</mark></span></div>';
      document.body.appendChild(div);
      const result = findSectionIdForHighlight({ current: div }, 'h1', sections);
      expect(result).toEqual({ id: 's1', heading: 'Intro' });
    });

    test('descends into prev sibling subtree to find last descendant heading', () => {
      const div = document.createElement('div');
      div.innerHTML =
        '<section><h2 id="s2">Core</h2></section><p><mark data-highlight-id="h1">x</mark></p>';
      document.body.appendChild(div);
      const result = findSectionIdForHighlight({ current: div }, 'h1', sections);
      expect(result).toEqual({ id: 's2', heading: 'Core' });
    });

    test('descends into prev sibling subtree with no-id heading, falls back to text match', () => {
      const div = document.createElement('div');
      div.innerHTML =
        '<section><h2>Core</h2></section><p><mark data-highlight-id="h1">x</mark></p>';
      document.body.appendChild(div);
      const result = findSectionIdForHighlight({ current: div }, 'h1', sections);
      expect(result?.heading).toBe('Core');
      expect(result?.id).toBe('s2');
    });
  });
});
