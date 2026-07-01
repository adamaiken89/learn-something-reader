import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'bun:test';

import { useSettingsStore } from '../../stores/settingsStore';
import WidthTransitionControl from './WidthTransitionControl';

beforeEach(() => {
  useSettingsStore.setState({
    contentWidth: 'standard',
    transitionStyle: 'none',
  });
});

describe('WidthTransitionControl', () => {
  const user = userEvent.setup();

  test('renders current width label', () => {
    const { getByText } = render(<WidthTransitionControl />);
    expect(getByText('Standard')).toBeInTheDocument();
  });

  test('cycles width on click', async () => {
    const { getByText } = render(<WidthTransitionControl />);
    await user.click(getByText('Standard'));
    expect(useSettingsStore.getState().contentWidth).toBe('wide');
  });

  test('wraps from wide to narrow', async () => {
    useSettingsStore.setState({ contentWidth: 'wide' });
    const { getByText } = render(<WidthTransitionControl />);
    await user.click(getByText('Wide'));
    expect(useSettingsStore.getState().contentWidth).toBe('narrow');
  });

  test('renders current transition label', () => {
    const { getByText } = render(<WidthTransitionControl />);
    expect(getByText('None')).toBeInTheDocument();
  });

  test('cycles transition on click', async () => {
    const { getByText } = render(<WidthTransitionControl />);
    await user.click(getByText('None'));
    expect(useSettingsStore.getState().transitionStyle).toBe('flip');
  });

  test('wraps from fade to none', async () => {
    useSettingsStore.setState({ transitionStyle: 'fade' });
    const { getByText } = render(<WidthTransitionControl />);
    await user.click(getByText('◦ Fade'));
    expect(useSettingsStore.getState().transitionStyle).toBe('none');
  });
});
