import { fireEvent, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, mock, test } from 'bun:test';

const mockResults = [
  {
    type: 'lesson',
    courseID: 'math',
    courseName: 'Mathematics',
    moduleID: '01',
    moduleName: 'Algebra',
    sectionID: null,
    sectionTitle: null,
    snippet: 'x + y = z',
  },
  {
    type: 'lesson',
    courseID: 'phys',
    courseName: 'Physics',
    moduleID: '02',
    moduleName: 'Mechanics',
    sectionID: 's2',
    sectionTitle: 'Newton Laws',
    snippet: 'F = ma',
  },
];

import { useCourseStore } from '../stores/courseStore';
import { useViewStore } from '../stores/viewStore';
import { clearMocks, mockResponse, setupRPC } from '../testUtils';
import SearchOverlay from './SearchOverlay';

setupRPC();

const baseCourse = {
  timeBudgetHours: 0,
  targetLevel: 'beginner',
  domain: 'general',
  prerequisites: [],
  learningObjectives: [],
  modules: [],
};

const mathCourse = {
  ...baseCourse,
  id: 'math',
  course: 'math',
  displayName: 'Mathematics',
  modules: [{ id: '01', name: 'Algebra', timeHours: 5, prerequisites: [], topics: [] }],
};
const physCourse = { ...baseCourse, id: 'phys', course: 'phys', displayName: 'Physics' };

beforeEach(() => {
  clearMocks();
  mockResponse('search', mockResults);
  useCourseStore.setState({
    courses: [mathCourse, physCourse],
    loaded: true,
    loading: false,
  });
});

describe('SearchOverlay', () => {
  const user = userEvent.setup();

  test('renders search input and ESC button', () => {
    const { getByPlaceholderText, getByText } = render(<SearchOverlay onClose={() => {}} />);
    expect(getByPlaceholderText('Search across courses...')).toBeInTheDocument();
    expect(getByText('ESC')).toBeInTheDocument();
  });

  test('shows all courses hint when no filters', () => {
    const { getByText } = render(<SearchOverlay onClose={() => {}} />);
    expect(getByText('No course filter — searching all courses')).toBeInTheDocument();
  });

  test('typing triggers search and shows results', async () => {
    const { getByPlaceholderText, findByText } = render(<SearchOverlay onClose={() => {}} />);
    await user.type(getByPlaceholderText('Search across courses...'), 'test');
    expect(await findByText('x + y = z', {}, { timeout: 1000 })).toBeInTheDocument();
  });

  test('shows results count', async () => {
    const { getByPlaceholderText, findByText } = render(<SearchOverlay onClose={() => {}} />);
    await user.type(getByPlaceholderText('Search across courses...'), 'test');
    expect(await findByText('Results (2)', {}, { timeout: 1000 })).toBeInTheDocument();
  });

  test('shows grouped course headers', async () => {
    const { getByPlaceholderText, findByText } = render(<SearchOverlay onClose={() => {}} />);
    await user.type(getByPlaceholderText('Search across courses...'), 'test');
    expect(await findByText('Mathematics', {}, { timeout: 1000 })).toBeInTheDocument();
    expect(await findByText('Physics', {}, { timeout: 1000 })).toBeInTheDocument();
  });

  test('adds course filter chip', async () => {
    const { getByText, findByPlaceholderText, queryByText, container } = render(
      <SearchOverlay onClose={() => {}} />,
    );
    expect(getByText('No course filter — searching all courses')).toBeInTheDocument();

    await user.click(getByText('+ Add course'));
    const filterInput = await findByPlaceholderText('Filter courses...');
    await user.type(filterInput, 'Math');

    const mathOption = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Mathematics' && b.closest('[class*="absolute"]'),
    );
    expect(mathOption).toBeTruthy();
    await user.click(mathOption!);

    expect(queryByText('No course filter — searching all courses')).toBeNull();
    const chips = container.querySelectorAll('[class*="rounded-full"]');
    expect(chips.length).toBe(1);
    expect(chips[0].textContent).toContain('Mathematics');
  });

  test('keyboard navigation selects result and pushes lesson view', async () => {
    const onClose = mock(() => {});
    useViewStore.setState({ views: [] });

    const { getByPlaceholderText, findByText } = render(<SearchOverlay onClose={onClose} />);

    const input = getByPlaceholderText('Search across courses...');
    await user.type(input, 'test');

    await findByText('x + y = z', {}, { timeout: 1000 });

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    const views = useViewStore.getState().views;
    expect(views).toHaveLength(1);
    const v = views[0];
    expect(v.type).toBe('lesson');
    if (v.type === 'lesson') {
      expect(v.course.id).toBe('math');
      expect(v.module.id).toBe('01');
    }

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  test('removes course filter chip', async () => {
    const { container, getByText } = render(
      <SearchOverlay initialCourseIDs={['math']} onClose={() => {}} />,
    );

    expect(getByText('Mathematics')).toBeInTheDocument();
    const closeBtn = container.querySelector('.lucide-x')!;
    await user.click(closeBtn);
    expect(getByText('No course filter — searching all courses')).toBeInTheDocument();
  });

  test('touch swipe down closes overlay', async () => {
    const onClose = mock(() => {});
    const { container, getByPlaceholderText, findByText } = render(
      <SearchOverlay onClose={onClose} />,
    );
    await user.type(getByPlaceholderText('Search across courses...'), 'test');
    await findByText('x + y = z', {}, { timeout: 1000 });
    const results = container.querySelector('.max-h-96')!;
    fireEvent.touchStart(results, {
      touches: [{ clientY: 100 }],
      changedTouches: [{ clientY: 100 }],
    });
    fireEvent.touchEnd(results, {
      touches: [{ clientY: 250 }],
      changedTouches: [{ clientY: 250 }],
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  test('touch swipe up does not close overlay', async () => {
    const onClose = mock(() => {});
    const { container, getByPlaceholderText, findByText } = render(
      <SearchOverlay onClose={onClose} />,
    );
    await user.type(getByPlaceholderText('Search across courses...'), 'test');
    await findByText('x + y = z', {}, { timeout: 1000 });
    const results = container.querySelector('.max-h-96')!;
    fireEvent.touchStart(results, {
      touches: [{ clientY: 250 }],
      changedTouches: [{ clientY: 250 }],
    });
    fireEvent.touchEnd(results, {
      touches: [{ clientY: 100 }],
      changedTouches: [{ clientY: 100 }],
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  test('clicking a result navigates and closes', async () => {
    const onClose = mock(() => {});
    useViewStore.setState({ views: [] });
    const { getByPlaceholderText, findByText } = render(<SearchOverlay onClose={onClose} />);
    await user.type(getByPlaceholderText('Search across courses...'), 'test');
    const result = await findByText('x + y = z', {}, { timeout: 1000 });
    await user.click(result);
    await waitFor(() => {
      expect(useViewStore.getState().views.some((v) => v.type === 'lesson')).toBe(true);
      expect(onClose).toHaveBeenCalled();
    });
  });
});
