import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'bun:test';

import { useSettingsStore } from '../../stores/settingsStore';
import FontSizeControl from './FontSizeControl';

beforeEach(() => {
  useSettingsStore.setState({ fontSize: 16 });
});

describe('FontSizeControl', () => {
  const user = userEvent.setup();

  test('displays current font size', () => {
    const { getByText } = render(<FontSizeControl />);
    expect(getByText('16')).toBeInTheDocument();
  });

  test('increments font size on A+ click', async () => {
    const { getByText } = render(<FontSizeControl />);
    await user.click(getByText('A+'));
    expect(useSettingsStore.getState().fontSize).toBe(18);
  });

  test('decrements font size on A- click', async () => {
    const { getByText } = render(<FontSizeControl />);
    await user.click(getByText('A-'));
    expect(useSettingsStore.getState().fontSize).toBe(14);
  });

  test('caps at max 28', async () => {
    useSettingsStore.setState({ fontSize: 28 });
    const { getByText } = render(<FontSizeControl />);
    await user.click(getByText('A+'));
    expect(useSettingsStore.getState().fontSize).toBe(28);
  });

  test('floors at min 10', async () => {
    useSettingsStore.setState({ fontSize: 10 });
    const { getByText } = render(<FontSizeControl />);
    await user.click(getByText('A-'));
    expect(useSettingsStore.getState().fontSize).toBe(10);
  });
});
