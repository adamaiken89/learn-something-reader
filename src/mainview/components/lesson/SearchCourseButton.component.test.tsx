import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'bun:test';

import { useLessonUIStore } from '../../stores/lessonUIStore';
import SearchCourseButton from './SearchCourseButton';

beforeEach(() => {
  useLessonUIStore.setState({ searchCourseOpen: false });
});

describe('SearchCourseButton', () => {
  const user = userEvent.setup();

  test('sets searchCourseOpen to true on click', async () => {
    const { getByText } = render(<SearchCourseButton />);
    await user.click(getByText(/Search/));
    expect(useLessonUIStore.getState().searchCourseOpen).toBe(true);
  });

  test('renders with search icon and label', () => {
    const { getByText } = render(<SearchCourseButton />);
    expect(getByText(/Search/)).toBeInTheDocument();
  });
});
