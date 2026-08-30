import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'bun:test';

import type { Highlight } from '../../../bun/types';
import { useBookmarksStore } from '../../stores/bookmarksStore';
import { useLessonViewStore } from '../../stores/lessonViewStore';
import { clearMocks, mockResponse, setupRPC } from '../../testUtils';
import HighlightItem from './HighlightItem';

setupRPC();

function mkHighlight(overrides: Partial<Highlight> = {}): Highlight {
  return {
    id: 'h1',
    courseID: 'math',
    moduleID: '01',
    selectedText: 'The indexer stores events',
    startOffset: 10,
    endOffset: 34,
    color: 'yellow',
    createdAt: '2024-01-01',
    ...overrides,
  };
}

beforeEach(() => {
  clearMocks();
  useBookmarksStore.setState({ byModule: {}, loading: {}, all: [], allLoading: false });
  useLessonViewStore.setState({
    contentRef: { current: null },
    markdownRef: { current: null },
    sections: [{ id: 'sec-1', heading: 'Architecture', level: 2, parentID: null }],
  });
});

describe('HighlightItem', () => {
  test('shows stored section heading without DOM walk', () => {
    const { getByText } = render(
      <HighlightItem highlight={mkHighlight({ sectionID: 'sec-1' })} onDelete={() => {}} />,
    );
    expect(getByText(/Architecture/)).toBeInTheDocument();
  });

  test('save toggle creates a highlight bookmark, second click removes it', async () => {
    const user = userEvent.setup();
    let created = false;
    mockResponse('addBookmark', () => {
      created = true;
      return {
        id: 'b1',
        courseID: 'math',
        moduleID: '01',
        sectionID: null,
        title: 'The indexer stores events',
        createdAt: '2024-01-01',
        kind: 'highlight' as const,
        snippet: 'The indexer stores events',
      };
    });
    mockResponse('deleteBookmark', { ok: true as const });

    const { getByText } = render(<HighlightItem highlight={mkHighlight()} onDelete={() => {}} />);
    await user.click(getByText('Save'));
    expect(created).toBe(true);
    expect(getByText('Saved')).toBeInTheDocument();

    await user.click(getByText('Saved'));
    expect(useBookmarksStore.getState().all).toHaveLength(0);
  });

  test('delete button invokes onDelete', async () => {
    const user = userEvent.setup();
    let deleted = false;
    const { getByText } = render(
      <HighlightItem
        highlight={mkHighlight()}
        onDelete={() => {
          deleted = true;
        }}
      />,
    );
    await user.click(getByText('Delete'));
    expect(deleted).toBe(true);
  });
});
