import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';

import { useLessonViewStore } from '../../stores/lessonViewStore';
import { clearMocks, setupRPC } from '../../testUtils';
import NavigationAITab from './NavigationAITab';

setupRPC();

describe('NavigationAITab', () => {
  const user = userEvent.setup();
  let originalWriteText: typeof navigator.clipboard.writeText;

  beforeAll(() => {
    originalWriteText = navigator.clipboard.writeText;
  });

  beforeEach(() => {
    clearMocks();
    useLessonViewStore.setState({ content: 'Lesson content about physics' });
  });

  afterAll(() => {
    // nothing to restore
  });

  test('renders two skill buttons', () => {
    const { getByText } = render(<NavigationAITab />);
    expect(getByText('Feynman Explain')).toBeInTheDocument();
    expect(getByText('Reframe')).toBeInTheDocument();
  });

  test('renders textarea', () => {
    const { getByPlaceholderText } = render(<NavigationAITab />);
    expect(getByPlaceholderText('Ask a question about this lesson...')).toBeInTheDocument();
  });

  test('click skill copies Feynman prompt after user types explanation', async () => {
    let copiedText = '';
    Object.assign(navigator.clipboard, {
      writeText: (t: string) => {
        copiedText = t;
        return Promise.resolve();
      },
    });
    const { getByText, getByPlaceholderText } = render(<NavigationAITab />);
    await user.click(getByText('Feynman Explain'));
    const textarea = getByPlaceholderText(
      'Type your explanation of the key concept in simple terms...',
    );
    await user.type(textarea, 'Gravity pulls objects toward Earth');
    await user.click(getByText('Send to Perplexity'));
    expect(copiedText).toContain('Gravity pulls objects toward Earth');
    expect(copiedText).toContain('curious 12-year-old');
    Object.assign(navigator.clipboard, { writeText: originalWriteText });
  });

  test('click Reframe copies prompt directly without textarea', async () => {
    let copiedText = '';
    Object.assign(navigator.clipboard, {
      writeText: (t: string) => {
        copiedText = t;
        return Promise.resolve();
      },
    });
    const { getByText } = render(<NavigationAITab />);
    await user.click(getByText('Reframe'));
    expect(copiedText).toContain('Socratic coach');
    Object.assign(navigator.clipboard, { writeText: originalWriteText });
  });

  test('Ask textarea + button copies prompt with question', async () => {
    let copiedText = '';
    Object.assign(navigator.clipboard, {
      writeText: (t: string) => {
        copiedText = t;
        return Promise.resolve();
      },
    });
    const { getByText, getByPlaceholderText } = render(<NavigationAITab />);
    const textarea = getByPlaceholderText('Ask a question about this lesson...');
    await user.type(textarea, 'What is gravity?');
    await user.click(getByText('Ask'));
    expect(copiedText).toContain('What is gravity?');
    expect(copiedText).toContain('helpful tutor');
    Object.assign(navigator.clipboard, { writeText: originalWriteText });
  });

  test('Ask button disabled when textarea empty', async () => {
    const { getByText } = render(<NavigationAITab />);
    const btn = getByText('Ask').closest('button')!;
    expect(btn.hasAttribute('disabled')).toBe(true);
  });

  test('Ask with whitespace-only input does nothing', async () => {
    let copiedText = '';
    Object.assign(navigator.clipboard, {
      writeText: (t: string) => {
        copiedText = t;
        return Promise.resolve();
      },
    });
    const { getByText, getByPlaceholderText } = render(<NavigationAITab />);
    const textarea = getByPlaceholderText('Ask a question about this lesson...');
    await user.type(textarea, '   ');
    const btn = getByText('Ask').closest('button')!;
    expect(btn.hasAttribute('disabled')).toBe(true);
    expect(copiedText).toBe('');
    Object.assign(navigator.clipboard, { writeText: originalWriteText });
  });

  test('Feynman back button returns to skill list', async () => {
    const { getByText } = render(<NavigationAITab />);
    await user.click(getByText('Feynman Explain'));
    expect(getByText('Send to Perplexity')).toBeInTheDocument();
    await user.click(getByText('Back'));
    expect(getByText('Reframe')).toBeInTheDocument();
  });

  test('Feynman Send button disabled when textarea empty', async () => {
    const { getByText } = render(<NavigationAITab />);
    await user.click(getByText('Feynman Explain'));
    const btn = getByText('Send to Perplexity').closest('button')!;
    expect(btn.hasAttribute('disabled')).toBe(true);
  });

  test('renders without content', () => {
    useLessonViewStore.setState({ content: '' });
    const { getByText } = render(<NavigationAITab />);
    expect(getByText('Feynman Explain')).toBeInTheDocument();
  });
});
