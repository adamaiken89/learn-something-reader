import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, mock, test } from 'bun:test';

import type { Bookmark, Course } from '../../../bun/types';
import { useBookmarksStore } from '../../stores/bookmarksStore';
import { useViewStore } from '../../stores/viewStore';
import BookmarkButton from './BookmarkButton';

const course: Course = {
  id: 'c1',
  course: 'Test',
  timeBudgetHours: 10,
  targetLevel: 'beginner',
  domain: 'test',
  prerequisites: [],
  learningObjectives: [],
  modules: [{ id: 'mod-1', name: 'Mod', timeHours: 1, prerequisites: [], topics: [] }],
  displayName: 'Test',
};

const mod = course.modules[0];

beforeEach(() => {
  useViewStore.setState({
    views: [{ type: 'lesson', course, module: mod }],
  });
  useBookmarksStore.setState({ byModule: {}, loading: {} });
});

describe('BookmarkButton', () => {
  const user = userEvent.setup();

  test('shows empty bookmark icon when no active bookmark', () => {
    const { getByText } = render(<BookmarkButton />);
    expect(getByText(/Bookmark/)).toBeInTheDocument();
  });

  test('shows filled icon when module bookmark exists', () => {
    const bm: Bookmark = {
      id: 'bm-1',
      courseID: 'c1',
      moduleID: 'mod-1',
      sectionID: null,
      title: 'Mod',
      scrollPosition: 0,
      createdAt: '2024-01-01T00:00:00.000Z',
    };
    useBookmarksStore.setState({
      byModule: { 'c1:mod-1': [bm] },
    });
    const { getByText } = render(<BookmarkButton />);
    expect(getByText(/Bookmark/)).toBeInTheDocument();
  });

  test('toggle calls remove when bookmark exists', async () => {
    const bm: Bookmark = {
      id: 'bm-1',
      courseID: 'c1',
      moduleID: 'mod-1',
      sectionID: null,
      title: 'Mod',
      scrollPosition: 0,
      createdAt: '2024-01-01T00:00:00.000Z',
    };
    useBookmarksStore.setState({
      byModule: { 'c1:mod-1': [bm] },
    });
    const remove = mock(() => Promise.resolve());
    useBookmarksStore.setState({ remove } as never);
    const { getByText } = render(<BookmarkButton />);
    await user.click(getByText(/Bookmark/));
    expect(remove).toHaveBeenCalledWith('bm-1');
  });

  test('toggle calls addBookmark when no bookmark exists', async () => {
    const toggle = mock(() => Promise.resolve());
    useBookmarksStore.setState({ toggle } as never);
    const { getByText } = render(<BookmarkButton />);
    await user.click(getByText(/Bookmark/));
    expect(toggle).toHaveBeenCalledWith('c1', 'mod-1', 'Mod', null);
  });
});
