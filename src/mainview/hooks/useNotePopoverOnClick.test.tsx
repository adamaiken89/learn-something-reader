import { fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { useRef } from 'react';

import type { Note } from '../../bun/types';
import { useSelectionStore } from '../stores/selectionStore';
import { useNotePopoverOnClick } from './useNotePopoverOnClick';

function Harness({ notes, onSelection }: { notes: Note[]; onSelection: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useNotePopoverOnClick(ref, notes, () => {}, onSelection);
  return (
    <div ref={ref} className="book-content">
      <p id="para">Hello world friend</p>
      <mark data-highlight-id="h1" data-note-id="n1">
        highlighted text
      </mark>
      <mark data-highlight-id="h2">unattached highlight</mark>
      <button>Action</button>
      <p>outside-content</p>
    </div>
  );
}

describe('useNotePopoverOnClick', () => {
  beforeEach(() => {
    useSelectionStore.setState({
      popoverNote: null,
    });
    window.getSelection()?.removeAllRanges();
  });
  afterEach(() => {
    window.getSelection()?.removeAllRanges();
  });

  test('ignores clicks on buttons', () => {
    const onSel = mock(() => {});
    const { getByText } = render(<Harness notes={[]} onSelection={onSel} />);
    fireEvent.click(getByText('Action'));
    expect(onSel).not.toHaveBeenCalled();
  });

  test('ignores clicks outside .book-content', () => {
    const onSel = mock(() => {});
    const { getByText } = render(<Harness notes={[]} onSelection={onSel} />);
    const outside = getByText('outside-content');
    fireEvent.click(outside);
    expect(onSel).not.toHaveBeenCalled();
  });

  test('selects mark text and triggers selection when no note attached', () => {
    const onSel = mock(() => {});
    const { getByText } = render(<Harness notes={[]} onSelection={onSel} />);
    fireEvent.click(getByText('unattached highlight'));
    expect(onSel).toHaveBeenCalled();
  });

  test('opens popover note when mark has matching note', () => {
    const note: Note = {
      id: 'n1',
      highlightID: 'h1',
      courseID: 'c1',
      moduleID: 'm1',
      sectionID: null,
      content: 'note text',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    const onSel = mock(() => {});
    const { getByText } = render(<Harness notes={[note]} onSelection={onSel} />);
    fireEvent.click(getByText('highlighted text'));
    const popover = useSelectionStore.getState().popoverNote;
    expect(popover?.note.id).toBe('n1');
    expect(onSel).not.toHaveBeenCalled();
  });

  test('routes to handleTextSelection when existing selection non-collapsed', () => {
    const onSel = mock(() => {});

    const Inner = () => {
      const ref = useRef<HTMLDivElement>(null);
      useNotePopoverOnClick(ref, [], () => {}, onSel);
      return (
        <div ref={ref} className="book-content">
          <p id="t2">target word</p>
        </div>
      );
    };
    const { getByText, container } = render(<Inner />);

    const para = container.querySelector('#t2')!;
    const range = document.createRange();
    range.setStart(para.firstChild!, 0);
    range.setEnd(para.firstChild!, 3);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
    expect(sel.isCollapsed).toBe(false);

    fireEvent.click(getByText('target word'));
    expect(onSel).toHaveBeenCalled();
  });
});
