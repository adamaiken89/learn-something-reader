import { fireEvent, render } from '@testing-library/react';
import { describe, expect, test } from 'bun:test';

import BottomSheet from './bottom-sheet';

// Radix portals sheet content to document.body and locks pointer events while
// open — assert against document and use fireEvent, not user-event pointers.

describe('BottomSheet', () => {
  test('renders nothing when closed', () => {
    render(
      <BottomSheet open={false} onClose={() => {}}>
        <p>Hidden content</p>
      </BottomSheet>,
    );
    expect(document.querySelector('[data-state="open"]')).toBeNull();
    expect(document.body.textContent).not.toContain('Hidden content');
  });

  test('renders children and title when open', () => {
    render(
      <BottomSheet open={true} onClose={() => {}} title="Sheet Title">
        <p>Sheet content</p>
      </BottomSheet>,
    );
    expect(document.body.textContent).toContain('Sheet Title');
    expect(document.body.textContent).toContain('Sheet content');
  });

  test('calls onClose on close button click', () => {
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
    const closeBtn = document.querySelector('[data-state="open"] button')!;
    expect(closeBtn).not.toBeNull();
    fireEvent.click(closeBtn);
    expect(closed).toBe(true);
  });

  test('drag beyond threshold closes sheet', () => {
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
    // Sheet content is portaled to document.body; find it there.
    const content = document.querySelector('.safe-area-bottom')!;
    expect(content).not.toBeNull();
    fireEvent.touchStart(content, {
      touches: [{ clientY: 100 }],
      changedTouches: [{ clientY: 100 }],
    });
    fireEvent.touchMove(content, {
      touches: [{ clientY: 260 }],
      changedTouches: [{ clientY: 260 }],
    });
    fireEvent.touchEnd(content);
    expect(closed).toBe(true);
    expect(container).toBeDefined();
  });

  test('drag below threshold keeps sheet open', () => {
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
    const content = document.querySelector('.safe-area-bottom')!;
    fireEvent.touchStart(content, {
      touches: [{ clientY: 100 }],
      changedTouches: [{ clientY: 100 }],
    });
    fireEvent.touchMove(content, {
      touches: [{ clientY: 140 }],
      changedTouches: [{ clientY: 140 }],
    });
    fireEvent.touchEnd(content);
    expect(closed).toBe(false);
  });

  test('Escape key closes sheet', () => {
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
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(closed).toBe(true);
  });
});
