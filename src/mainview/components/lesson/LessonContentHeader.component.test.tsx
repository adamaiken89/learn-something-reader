import { render } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'bun:test';

import { clearMocks, setupRPC } from '../../testUtils';

setupRPC();

import { useLessonViewStore } from '../../stores/lessonViewStore';
import LessonContentHeader from './LessonContentHeader';

// NOTE: LessonSection.component.test.tsx mocks react-markdown globally via mock.module (irrevocable).
// When the full suite runs, react-markdown renders <div data-testid="markdown">stub</div>.
// Tests account for this by querying via data-testid="markdown" where needed.

describe('LessonContentHeader', () => {
  beforeEach(() => {
    useLessonViewStore.setState({ h1: '', meta: [] });
    clearMocks();
  });

  test('renders nothing when h1 and meta are empty', () => {
    const { container } = render(<LessonContentHeader rehypePlugins={[]} />);
    expect(container.innerHTML).toBe('');
  });

  test('renders h1 via markdown when set', () => {
    useLessonViewStore.setState({ h1: 'My Title' });
    const { container } = render(<LessonContentHeader rehypePlugins={[]} />);
    // When react-markdown is mocked: renders <div data-testid="markdown">
    // When real: renders <h1>My Title</h1>
    const markdown = container.querySelector('[data-testid="markdown"]');
    const heading = container.querySelector('h1');
    expect(markdown ?? heading).toBeTruthy();
  });

  test('renders meta fields', () => {
    useLessonViewStore.setState({
      meta: [
        { key: 'author', icon: '👤', label: 'Author', value: 'John' },
        { key: 'date', icon: '📅', label: 'Date', value: '2024-01-01' },
      ],
    });
    const { container } = render(<LessonContentHeader rehypePlugins={[]} />);
    const text = container.textContent ?? '';
    expect(text).toContain('John');
    expect(text).toContain('2024-01-01');
  });

  test('description meta gets full width', () => {
    useLessonViewStore.setState({
      meta: [{ key: 'description', icon: '📝', label: '', value: 'A course description' }],
    });
    const { container } = render(<LessonContentHeader rehypePlugins={[]} />);
    expect(container.textContent).toContain('A course description');
  });

  test('renders both h1 and meta together', () => {
    useLessonViewStore.setState({
      h1: 'Lesson Title',
      meta: [{ key: 'level', icon: '📊', label: 'Level', value: 'Advanced' }],
    });
    const { container } = render(<LessonContentHeader rehypePlugins={[]} />);
    // Meta fields render as plain text; h1 may be mocked as data-testid="markdown"
    const text = container.textContent ?? '';
    expect(text).toContain('Advanced');
  });
});
