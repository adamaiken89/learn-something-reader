import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, mock, test } from 'bun:test';

import type { Note } from '../../bun/types';
import { useSelectionStore } from '../stores/selectionStore';
import { useNotePopoverOnClick } from './useNotePopoverOnClick';

beforeEach(() => {
  useSelectionStore.setState({
    popoverNote: null,
    selectedHighlightId: null,
    showToolbar: false,
    selection: null,
  });
});

function makeEl(): HTMLDivElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

function makeMark(id: string, noteId?: string) {
  const mark = document.createElement('mark');
  mark.dataset.highlightId = id;
  if (noteId) mark.dataset.noteId = noteId;
  return mark;
}

function makeNote(overrides: Partial<Note> & { id: string }): Note {
  return {
    courseID: 'c1',
    moduleID: 'm1',
    highlightID: null,
    sectionID: null,
    content: '',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

describe('useNotePopoverOnClick', () => {
  test('does nothing when ref has no current', () => {
    const spy = mock(() => {});
    renderHook(() =>
      useNotePopoverOnClick(
        { current: null },
        [],
        spy,
        mock(() => {}),
      ),
    );
  });

  test('click on mark with noteId opens popover', () => {
    const el = makeEl();
    const mark = makeMark('h1', 'n1');
    el.appendChild(mark);

    const notes = [makeNote({ id: 'n1', highlightID: 'h1', content: 'note' })];
    const setSelected = mock(() => {});
    const handleSel = mock(() => {});

    renderHook(() => useNotePopoverOnClick({ current: el }, notes, setSelected, handleSel));

    // The handler uses e.target.tagName === 'MARK', so we need the event target to be the mark.
    // Using mark.click() dispatches a real event with proper target.
    act(() => mark.click());

    const state = useSelectionStore.getState();
    expect(state.popoverNote).not.toBeNull();
    expect(state.popoverNote?.note.highlightID).toBe('h1');
  });

  test('click on mark without noteId selects highlight', () => {
    const el = makeEl();
    const mark = makeMark('h2');
    el.appendChild(mark);

    const setSelected = mock(() => {});
    const handleSel = mock(() => {});

    renderHook(() => useNotePopoverOnClick({ current: el }, [], setSelected, handleSel));

    act(() => mark.click());

    expect(setSelected).toHaveBeenCalledWith('h2');
    expect(handleSel).toHaveBeenCalled();
  });

  test('click on button does not trigger word selection', () => {
    const el = makeEl();
    const btn = document.createElement('button');
    btn.textContent = 'click me';
    el.appendChild(btn);

    const setSelected = mock(() => {});
    const handleSel = mock(() => {});

    renderHook(() => useNotePopoverOnClick({ current: el }, [], setSelected, handleSel));

    act(() => btn.click());

    expect(handleSel).not.toHaveBeenCalled();
  });

  test('cleanup removes event listener', () => {
    const el = makeEl();

    const { unmount } = renderHook(() =>
      useNotePopoverOnClick(
        { current: el },
        [],
        mock(() => {}),
        mock(() => {}),
      ),
    );

    unmount();
  });
});
