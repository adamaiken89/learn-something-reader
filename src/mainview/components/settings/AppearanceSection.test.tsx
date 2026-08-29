import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'bun:test';

import { useSettingsStore } from '../../stores/settingsStore';
import AppearanceSection from './AppearanceSection';
beforeEach(() => {
  useSettingsStore.setState({
    theme: 'light',
    fontSize: 16,
    contentWidth: 'standard',
    textFont: 'georgia',
    codeFont: 'sfmono',
    transitionStyle: 'none',
  });
});

describe('AppearanceSection', () => {
  test('renders all setting groups', () => {
    const { getAllByText } = render(<AppearanceSection />);
    expect(getAllByText('Reading Theme').length).toBeGreaterThan(0);
    expect(getAllByText('Font Size').length).toBeGreaterThan(0);
    expect(getAllByText('Content Width').length).toBeGreaterThan(0);
    expect(getAllByText('Text Font').length).toBeGreaterThan(0);
    expect(getAllByText('Code Font').length).toBeGreaterThan(0);
    expect(getAllByText('Page Transition').length).toBeGreaterThan(0);
  });

  test('font size inc/dec buttons update store', async () => {
    const user = userEvent.setup();
    const { getByText } = render(<AppearanceSection />);
    const inc = getByText('A⁺');
    await user.click(inc);
    expect(useSettingsStore.getState().fontSize).toBe(18);
    const dec = getByText('A⁻');
    await user.click(dec);
    expect(useSettingsStore.getState().fontSize).toBe(16);
  });

  test('content width pill click sets contentWidth', async () => {
    const user = userEvent.setup();
    const { getByText } = render(<AppearanceSection />);
    await user.click(getByText('Wide'));
    expect(useSettingsStore.getState().contentWidth).toBe('wide');
  });

  test('page transition pill click sets transitionStyle', async () => {
    const user = userEvent.setup();
    const { getByText } = render(<AppearanceSection />);
    await user.click(getByText('Slide'));
    expect(useSettingsStore.getState().transitionStyle).toBe('slide');
  });

  test('text font pill click sets textFont', async () => {
    const user = userEvent.setup();
    const { getByText } = render(<AppearanceSection />);
    await user.click(getByText('Charter'));
    expect(useSettingsStore.getState().textFont).toBe('charter');
  });

  test('code font pill click sets codeFont', async () => {
    const user = userEvent.setup();
    const { getByText } = render(<AppearanceSection />);
    await user.click(getByText('SF Mono'));
    expect(useSettingsStore.getState().codeFont).toBe('sfmono');
  });

  test('theme button click sets theme', async () => {
    const user = userEvent.setup();
    const { container } = render(<AppearanceSection />);
    const themeBtns = container.querySelectorAll('.grid-cols-3 button');
    await user.click(themeBtns[1] as HTMLElement);
    expect(useSettingsStore.getState().theme).not.toBe('light');
  });
});
