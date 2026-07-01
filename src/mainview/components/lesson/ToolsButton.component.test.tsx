import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'bun:test';

import { useLessonUIStore } from '../../stores/lessonUIStore';
import ToolsButton from './ToolsButton';

beforeEach(() => {
  useLessonUIStore.setState({ showTools: false });
});

describe('ToolsButton', () => {
  const user = userEvent.setup();

  test('toggles showTools on click', async () => {
    const { getByText } = render(<ToolsButton />);
    await user.click(getByText('Tools'));
    expect(useLessonUIStore.getState().showTools).toBe(true);
  });

  test('toggles off when already active', async () => {
    useLessonUIStore.setState({ showTools: true });
    const { getByText } = render(<ToolsButton />);
    await user.click(getByText('Tools'));
    expect(useLessonUIStore.getState().showTools).toBe(false);
  });

  test('uses active styles when showTools is true', () => {
    useLessonUIStore.setState({ showTools: true });
    const { getByText } = render(<ToolsButton />);
    const btn = getByText('Tools').closest('button');
    expect(btn?.className).toContain('bg-indigo-600');
  });

  test('uses inactive styles when showTools is false', () => {
    const { getByText } = render(<ToolsButton />);
    const btn = getByText('Tools').closest('button');
    expect(btn?.className).toContain('bg-gray-700');
  });
});
