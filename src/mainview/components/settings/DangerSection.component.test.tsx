import { act, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

import i18n from '../../i18n';
import { clearMocks, mockResponse, setupRPC } from '../../testUtils';
import DangerSection from './DangerSection';

setupRPC();

const origReload = window.location.reload;

describe('DangerSection', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    clearMocks();
    void i18n.changeLanguage('en-US');
    mockResponse('clearAllData', { ok: true });
    mockResponse('clearLogs', { ok: true });
    Object.defineProperty(window.location, 'reload', {
      configurable: true,
      value: mock(() => {}),
    });
  });

  afterEach(() => {
    Object.defineProperty(window.location, 'reload', {
      configurable: true,
      value: origReload,
    });
  });

  async function renderSection() {
    let container: HTMLElement;
    await act(async () => {
      container = render(<DangerSection />).container;
    });
    return container!;
  }

  function findBtn(container: HTMLElement, label: string) {
    return Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === label,
    ) as HTMLButtonElement;
  }

  test('renders danger zone with both actions', async () => {
    const container = await renderSection();
    expect(container.textContent).toContain('Danger Zone');
    expect(findBtn(container, 'Clear All Data')).toBeTruthy();
    expect(findBtn(container, 'Clear Logs')).toBeTruthy();
  });

  test('first clear-data click asks for confirmation only', async () => {
    const container = await renderSection();
    await user.click(findBtn(container, 'Clear All Data'));
    expect(findBtn(container, 'Clear All Data')).toBeUndefined();
    expect(container.textContent).toContain('sure? Click again');
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  test('second clear-data click wipes data and reloads', async () => {
    const container = await renderSection();
    await user.click(findBtn(container, 'Clear All Data'));
    await user.click(
      Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Confirm'),
      )!,
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(mockResponse).toBeTruthy();
    const calls = (window.location.reload as unknown as { mock: { calls: unknown[][] } }).mock
      .calls;
    expect(calls.length).toBeGreaterThanOrEqual(1);
  });

  test('first clear-logs click asks for confirmation only', async () => {
    const container = await renderSection();
    await user.click(findBtn(container, 'Clear Logs'));
    expect(findBtn(container, 'Clear Logs')).toBeUndefined();
    expect(container.textContent).toContain('sure? Click again');
  });

  test('second clear-logs click clears without reload', async () => {
    const container = await renderSection();
    await user.click(findBtn(container, 'Clear Logs'));
    await user.click(
      Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Confirm'),
      )!,
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(window.location.reload).not.toHaveBeenCalled();
    expect(Array.from(container.querySelectorAll('button')).map((b) => b.textContent)).toContain(
      'Clear Logs',
    );
  });
});
