import { describe, expect, test } from 'bun:test';

import { parse } from './yaml';

describe('yaml parse - top-level inline array', () => {
  test('inline array at root level', () => {
    const result = parse('[1, 2, 3]');
    expect(result).toEqual([1, 2, 3]);
  });

  test('inline array with strings', () => {
    const result = parse('[a, b, c]');
    expect(result).toEqual(['a', 'b', 'c']);
  });

  test('inline array with mixed types', () => {
    const result = parse('[1, true, null, hello]');
    expect(result).toEqual([1, true, null, 'hello']);
  });
});

describe('yaml parse - sequences', () => {
  test('empty items via comment stripping', () => {
    const result = parse(`
items:
  - # comment-only after dash
  - second
`);
    expect(result).toEqual({ items: [null, 'second'] });
  });

  test('empty item with nested sub-mapping', () => {
    const result = parse(`
items:
  - # comment
    nested: true
  - second
`);
    expect(result).toEqual({ items: [{ nested: true }, 'second'] });
  });

  test('comment-only lines in sequence', () => {
    const result = parse(`
items:
  - first
  # comment line
  - second
`);
    expect(result).toEqual({ items: ['first', 'second'] });
  });

  test('greater indented line folds into preceding sequence scalar', () => {
    const result = parse(`
items:
  - first
    should be joined
  - second
`);
    expect(result).toEqual({ items: ['first should be joined', 'second'] });
  });

  test('inline array in sequence entry', () => {
    const result = parse(`
items:
  - [1, 2, 3]
  - second
`);
    expect(result).toEqual({ items: [[1, 2, 3], 'second'] });
  });

  test('sequence entry with kv pair', () => {
    const result = parse(`
items:
  - key: val
  - second
`);
    expect(result).toEqual({ items: [{ key: 'val' }, 'second'] });
  });

  test('sequence entry with quoted string', () => {
    const result = parse(`
items:
  - "quoted string"
  - plain
`);
    expect(result).toEqual({ items: ['quoted string', 'plain'] });
  });
});

describe('yaml parse - mappings', () => {
  test('inline array as mapping value', () => {
    const result = parse(`
data:
  tags: [a, b, c]
  name: test
`);
    expect(result).toEqual({ data: { tags: ['a', 'b', 'c'], name: 'test' } });
  });

  test('nested mapping with indented content', () => {
    const result = parse(`
parent:
  child:
    grandchild: value
  sibling: other
`);
    expect(result).toEqual({
      parent: { child: { grandchild: 'value' }, sibling: 'other' },
    });
  });

  test('comments before indented mapping content', () => {
    const result = parse(`
parent:
  # comment before child
  child: value
`);
    expect(result).toEqual({ parent: { child: 'value' } });
  });
});

describe('yaml parse - mapping edge cases', () => {
  test('orphan indented line folds into preceding scalar', () => {
    const result = parse(`
key: value
  orphan continuation
otherkey: otherval
`);
    expect(result).toEqual({ key: 'value orphan continuation', otherkey: 'otherval' });
  });

  test('empty mapping value with no sub-indent returns null', () => {
    const result = parse(`
key:
nextkey: value
`);
    expect(result).toEqual({ key: null, nextkey: 'value' });
  });

  test('empty mapping value followed by comment returns null', () => {
    const result = parse(`
key:
# just comment
nextkey: value
`);
    expect(result).toEqual({ key: null, nextkey: 'value' });
  });
});

describe('yaml parse - edge cases', () => {
  test('scalar with comment', () => {
    const result = parse('value # this is a comment');
    expect(result).toBe('value');
  });

  test('line with only comment', () => {
    const result = parse(`
# just a comment
key: value
# another comment
`);
    expect(result).toEqual({ key: 'value' });
  });

  test('empty string returns null', () => {
    const result = parse('');
    expect(result).toBeNull();
  });

  test('whitespace-only string returns null', () => {
    const result = parse('   \n  ');
    expect(result).toBeNull();
  });

  test('comment-only doc returns null', () => {
    const result = parse('# just a comment\n');
    expect(result).toBeNull();
  });

  test('inline array with empty brackets', () => {
    const result = parse('[]');
    expect(result).toEqual([]);
  });

  test('maps empty inline array as value', () => {
    const result = parse(`
data:
  tags: []
  name: test
`);
    expect(result).toEqual({ data: { tags: [], name: 'test' } });
  });
});

describe('yaml parse - multi-line scalars (regression)', () => {
  test('wrapped explanation folds into single string', () => {
    const result = parse(`
explanation: A state management library built for React,
  using Zustand with proxies for efficient reactivity and
  selector-based subscriptions.
`);
    expect(result).toEqual({
      explanation:
        'A state management library built for React, using Zustand with proxies for efficient reactivity and selector-based subscriptions.',
    });
  });

  test('wrapped string in sequence folds', () => {
    const result = parse(`
items:
  - Zustand with
    proxies under the hood
`);
    expect(result).toEqual({ items: ['Zustand with proxies under the hood'] });
  });

  test('url with fragment preserved', () => {
    const result = parse('url: https://example.com/path#section');
    expect(result).toEqual({ url: 'https://example.com/path#section' });
  });

  test('url with port preserved', () => {
    const result = parse('url: https://example.com:8080/path');
    expect(result).toEqual({ url: 'https://example.com:8080/path' });
  });
});

describe('yaml parse - js-yaml strictness', () => {
  test('duplicate keys last-wins', () => {
    const result = parse(`
a: 1
b: 2
a: 3
`);
    expect(result).toEqual({ a: 3, b: 2 });
  });

  test('date-like scalar stays string', () => {
    const result = parse('d: 2024-01-01');
    expect(result).toEqual({ d: '2024-01-01' });
  });

  test('yes/no scalars stay strings', () => {
    const result = parse(`
a: yes
b: no
`);
    expect(result).toEqual({ a: 'yes', b: 'no' });
  });
});
