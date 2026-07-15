import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'bun:test';

import BottomSheet from './BottomSheet';

describe('BottomSheet', () => {
  const user = userEvent.setup();

  test('renders nothing when closed', () => {
    const { container } = render(
      <BottomSheet open={false} onClose={() => {}}>
        <p>Content</p>
      </BottomSheet>,
    );
    expect(container.textContent).not.toContain('Content');
  });

  test('renders children and title when open', () => {
    const { container } = render(
      <BottomSheet open={true} onClose={() => {}} title="Sheet Title">
        <p>Sheet content</p>
      </BottomSheet>,
    );
    expect(container.textContent).toContain('Sheet Title');
    expect(container.textContent).toContain('Sheet content');
  });

  test('calls onClose on overlay click', async () => {
    let closed = false;
    const { container } = render(
      <BottomSheet
        open={true}
        onClose={() => {
          closed = true;
        }}
      >
        <p>Content</p>
      </BottomSheet>,
    );
    const overlay = container.querySelector('.absolute.inset-0.bg-black\\/60')!;
    await user.click(overlay);
    expect(closed).toBe(true);
  });

  test('calls onClose on close button click', async () => {
    let closed = false;
    const { container } = render(
      <BottomSheet
        open={true}
        onClose={() => {
          closed = true;
        }}
      >
        <p>Content</p>
      </BottomSheet>,
    );
    const closeBtn = container.querySelector('button')!;
    await user.click(closeBtn);
    expect(closed).toBe(true);
  });

  test('Escape key closes sheet', async () => {
    let closed = false;
    render(
      <BottomSheet
        open={true}
        onClose={() => {
          closed = true;
        }}
      >
        <p>Content</p>
      </BottomSheet>,
    );
    await user.keyboard('{Escape}');
    expect(closed).toBe(true);
  });

  test('does not render when open is false', () => {
    const { container } = render(
      <BottomSheet open={false} onClose={() => {}}>
        <p>Hidden content</p>
      </BottomSheet>,
    );
    expect(container.querySelector('.fixed')).toBeNull();
  });
});
