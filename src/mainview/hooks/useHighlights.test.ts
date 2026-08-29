import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'bun:test';

import { useHighlightsStore } from '../stores/highlightsStore';
import { clearMocks, mockResponse, setupRPC } from '../testUtils';
import { useHighlights } from './useHighlights';

setupRPC();

beforeEach(() => {
  clearMocks();
  mockResponse('getHighlights', []);
  mockResponse('addHighlight', {
    id: 'h1',
    courseID: 'c1',
    moduleID: 'm1',
    selectedText: 'hello',
    color: 'yellow',
    startOffset: 0,
    endOffset: 5,
    createdAt: '2026-01-01',
  });
  mockResponse('deleteHighlight', { ok: true });
  useHighlightsStore.setState({ byModule: {}, loading: {} });
});

describe('useHighlights', () => {
  test('returns empty highlights initially', async () => {
    let result: { current: ReturnType<typeof useHighlights> } | undefined;
    await act(async () => {
      result = renderHook(() => useHighlights('c1', 'm1')).result as {
        current: ReturnType<typeof useHighlights>;
      };
    });
    expect(result!.current.highlights).toEqual([]);
    expect(result!.current.loading).toBe(false);
  });

  test('returns highlights from store', () => {
    useHighlightsStore.setState({
      byModule: { 'c1:m1': [{ id: 'h1', text: 'hi' } as never] },
    });
    const { result } = renderHook(() => useHighlights('c1', 'm1'));
    expect(result.current.highlights).toHaveLength(1);
  });

  test('returns loading state from store', () => {
    useHighlightsStore.setState({ loading: { 'c1:m1': true } });
    const { result } = renderHook(() => useHighlights('c1', 'm1'));
    expect(result.current.loading).toBe(true);
  });

  test('addHighlight calls store.add', async () => {
    const { result } = renderHook(() => useHighlights('c1', 'm1'));
    await act(async () => {
      await result.current.addHighlight('text', 'yellow', 0, 4);
    });
    const stored = useHighlightsStore.getState().byModule['c1:m1'];
    expect(stored).toHaveLength(1);
    expect(stored?.[0]?.color).toBe('yellow');
  });

  test('addHighlight works without offsets', async () => {
    const { result } = renderHook(() => useHighlights('c1', 'm1'));
    await act(async () => {
      await result.current.addHighlight('text', 'blue');
    });
    const stored = useHighlightsStore.getState().byModule['c1:m1'];
    expect(stored).toHaveLength(1);
  });

  test('deleteHighlight calls store.remove', async () => {
    useHighlightsStore.setState({
      byModule: { 'c1:m1': [{ id: 'h1', text: 'x' } as never] },
    });
    const { result } = renderHook(() => useHighlights('c1', 'm1'));
    await act(async () => {
      await result.current.deleteHighlight('h1');
    });
    expect(useHighlightsStore.getState().byModule['c1:m1']).toHaveLength(0);
  });
});
