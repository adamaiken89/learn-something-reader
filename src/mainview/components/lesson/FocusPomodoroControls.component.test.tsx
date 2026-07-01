import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'bun:test';

import { clearMocks, setupRPC } from '../../testUtils';

setupRPC();

import { useLessonUIStore } from '../../stores/lessonUIStore';
import { useSettingsStore } from '../../stores/settingsStore';
import FocusPomodoroControls from './FocusPomodoroControls';

describe('FocusPomodoroControls', () => {
  beforeEach(() => {
    useSettingsStore.setState({ focusMode: false });
    useLessonUIStore.setState({ showPomodoro: false });
    clearMocks();
  });

  test('renders focus mode off button (shows "Focus")', () => {
    const { getByText } = render(<FocusPomodoroControls />);
    expect(getByText('Focus')).toBeInTheDocument();
  });

  test('renders pomodoro button', () => {
    const { container } = render(<FocusPomodoroControls />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  test('toggles focus mode on click', async () => {
    const user = userEvent.setup();
    const { getByText } = render(<FocusPomodoroControls />);
    await user.click(getByText('Focus'));
    expect(useSettingsStore.getState().focusMode).toBe(true);
  });

  test('shows "Exit Focus" when focus mode is enabled', () => {
    useSettingsStore.setState({ focusMode: true });
    const { getByText } = render(<FocusPomodoroControls />);
    expect(getByText('Exit Focus')).toBeInTheDocument();
  });

  test('toggles focus mode off when already on', async () => {
    useSettingsStore.setState({ focusMode: true });
    const user = userEvent.setup();
    const { getByText } = render(<FocusPomodoroControls />);
    await user.click(getByText('Exit Focus'));
    expect(useSettingsStore.getState().focusMode).toBe(false);
  });
});
