import { describe, expect, test, beforeEach } from 'bun:test';

import { fsMockImpl } from '../testFsShared';
import { invalidateCache } from './persistence';
import * as annotations from './persistence-annotations';

let storageData: import('./types').StorageData;
let written: Array<{ path: string; data: string }> = [];

beforeEach(() => {
  invalidateCache();
  storageData = {
    highlights: [],
    notes: [],
    bookmarks: [],
    completedModules: [],
    studySessions: [],
  };
  written = [];
  Object.assign(fsMockImpl, {
    existsSync: () => true,
    readFileSync: (p: string) => {
      if (p.includes('data.json')) return JSON.stringify(storageData);
      return '';
    },
    writeFileSync: (_p: string, data: string) => {
      written.push({ path: _p, data });
      storageData = JSON.parse(data);
    },
    mkdirSync: () => {},
  });
});

describe('highlights', () => {
  test('addHighlight creates record with uuid and default color', () => {
    const h = annotations.addHighlight('math', '01', 'some text', 0, 9);
    expect(h.id).toBeTruthy();
    expect(h.color).toBe('yellow');
    expect(h.createdAt).toBeTruthy();
    expect(storageData.highlights).toHaveLength(1);
  });

  test('addHighlight dedupes same coords by recoloring existing', () => {
    const first = annotations.addHighlight('math', '01', 'same text', 5, 10, 'yellow');
    const second = annotations.addHighlight('math', '01', 'same text', 5, 10, 'green');
    expect(second.id).toBe(first.id);
    expect(second.color).toBe('green');
    expect(storageData.highlights).toHaveLength(1);
  });

  test('different coords create separate highlights', () => {
    annotations.addHighlight('math', '01', 'text a', 0, 5);
    annotations.addHighlight('math', '01', 'text b', 10, 15);
    expect(storageData.highlights).toHaveLength(2);
  });

  test('getHighlightsForModule filters and sorts oldest first', () => {
    storageData.highlights = [
      {
        id: 'h-new',
        courseID: 'math',
        moduleID: '01',
        selectedText: 'b',
        startOffset: 1,
        endOffset: 2,
        color: 'yellow',
        createdAt: '2026-08-20T00:00:00Z',
      },
      {
        id: 'h-old',
        courseID: 'math',
        moduleID: '01',
        selectedText: 'a',
        startOffset: 3,
        endOffset: 4,
        color: 'yellow',
        createdAt: '2026-08-01T00:00:00Z',
      },
      {
        id: 'h-other',
        courseID: 'other',
        moduleID: '01',
        selectedText: 'c',
        startOffset: 5,
        endOffset: 6,
        color: 'yellow',
        createdAt: '2026-08-25T00:00:00Z',
      },
    ];
    invalidateCache();
    const hs = annotations.getHighlightsForModule('math', '01');
    expect(hs.map((h) => h.id)).toEqual(['h-old', 'h-new']);
  });

  test('deleteHighlight removes only matching id', () => {
    const h = annotations.addHighlight('math', '01', 'x', 0, 1);
    annotations.addHighlight('math', '01', 'y', 2, 3);
    annotations.deleteHighlight(h.id);
    expect(storageData.highlights.map((x) => x.selectedText)).toEqual(['y']);
  });
});

describe('notes', () => {
  test('addNote nulls optional refs when omitted', () => {
    const n = annotations.addNote('math', '01', 'my note');
    expect(n.highlightID).toBeNull();
    expect(n.sectionID).toBeNull();
    expect(n.createdAt).toBe(n.updatedAt);
  });

  test('addNote links highlight and section when given', () => {
    const n = annotations.addNote('math', '01', 'note', 'h-1', 'sec-1');
    expect(n.highlightID).toBe('h-1');
    expect(n.sectionID).toBe('sec-1');
  });

  test('getNotesForModule filters oldest first', () => {
    storageData.notes = [
      {
        id: 'n2',
        courseID: 'math',
        moduleID: '01',
        highlightID: null,
        sectionID: null,
        content: 'newer',
        createdAt: '2026-08-22T00:00:00Z',
        updatedAt: '2026-08-22T00:00:00Z',
      },
      {
        id: 'n1',
        courseID: 'math',
        moduleID: '01',
        highlightID: null,
        sectionID: null,
        content: 'older',
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
      },
    ];
    invalidateCache();
    expect(annotations.getNotesForModule('math', '01').map((n) => n.id)).toEqual(['n1', 'n2']);
    expect(annotations.getNotesForModule('math', '02')).toEqual([]);
  });

  test('updateNote changes content and updatedAt, ignores unknown id', () => {
    const n = annotations.addNote('math', '01', 'before');
    annotations.updateNote(n.id, 'after');
    const stored = storageData.notes[0];
    expect(stored.content).toBe('after');
    expect(new Date(stored.updatedAt) >= new Date(n.createdAt)).toBe(true);
    const count = storageData.notes.length;
    annotations.updateNote('nope', 'ghost');
    expect(storageData.notes.length).toBe(count);
  });

  test('deleteNote removes matching id', () => {
    const n = annotations.addNote('math', '01', 'bye');
    annotations.deleteNote(n.id);
    expect(storageData.notes).toHaveLength(0);
  });
});

describe('addAnnotation', () => {
  test('creates linked highlight + note in one call', () => {
    const { highlight, note } = annotations.addAnnotation({
      courseID: 'math',
      moduleID: '01',
      selectedText: 'key idea',
      startOffset: 12,
      endOffset: 20,
      color: 'rose',
      noteContent: 'why this matters',
    });
    expect(highlight.color).toBe('rose');
    expect(note.highlightID).toBe(highlight.id);
    expect(note.content).toBe('why this matters');
    expect(storageData.highlights).toHaveLength(1);
    expect(storageData.notes).toHaveLength(1);
  });
});

describe('bookmarks', () => {
  test('addBookmark defaults kind module, nulls sectionID, omits scrollPosition', () => {
    const b = annotations.addBookmark('math', '01', 'Intro');
    expect(b.kind).toBe('module');
    expect(b.sectionID).toBeNull();
    expect(b.scrollPosition).toBeUndefined();
  });

  test('addBookmark stores section kind and extras', () => {
    const b = annotations.addBookmark('math', '01', 'Deep dive', 'sec-7');
    expect(b.sectionID).toBe('sec-7');
    expect(b.kind).toBe('section');

    const h = annotations.addBookmark('math', '01', 'key term', undefined, {
      kind: 'highlight',
      snippet: 'key term',
    });
    expect(h.kind).toBe('highlight');
    expect(h.snippet).toBe('key term');
  });

  test('getAllBookmarks sorts newest first across courses', () => {
    storageData.bookmarks = [
      {
        id: 'b1',
        courseID: 'a',
        moduleID: '01',
        sectionID: null,
        title: 'old',
        scrollPosition: 0,
        createdAt: '2026-07-01T00:00:00Z',
      },
      {
        id: 'b2',
        courseID: 'b',
        moduleID: '02',
        sectionID: null,
        title: 'new',
        scrollPosition: 0,
        createdAt: '2026-08-25T00:00:00Z',
      },
    ];
    invalidateCache();
    expect(annotations.getAllBookmarks().map((b) => b.id)).toEqual(['b2', 'b1']);
  });

  test('course and module filters keep newest-first order', () => {
    storageData.bookmarks = [
      {
        id: 'b1',
        courseID: 'math',
        moduleID: '01',
        sectionID: null,
        title: 'first',
        scrollPosition: 0,
        createdAt: '2026-07-01T00:00:00Z',
      },
      {
        id: 'b2',
        courseID: 'physics',
        moduleID: '01',
        sectionID: null,
        title: 'other course',
        scrollPosition: 0,
        createdAt: '2026-08-25T00:00:00Z',
      },
      {
        id: 'b3',
        courseID: 'math',
        moduleID: '02',
        sectionID: null,
        title: 'second',
        scrollPosition: 0,
        createdAt: '2026-08-25T12:00:00Z',
      },
    ];
    invalidateCache();
    expect(annotations.getBookmarksForCourse('math').map((b) => b.title)).toEqual([
      'second',
      'first',
    ]);
    expect(annotations.getBookmarksForModule('math', '01').map((b) => b.title)).toEqual(['first']);
  });

  test('deleteBookmark removes matching id', () => {
    const b = annotations.addBookmark('math', '01', 'gone soon');
    annotations.addBookmark('math', '02', 'stays');
    annotations.deleteBookmark(b.id);
    expect(storageData.bookmarks.map((b) => b.title)).toEqual(['stays']);
  });

  test('isBookmarked checks course+module pair', () => {
    annotations.addBookmark('math', '01', 'x');
    expect(annotations.isBookmarked('math', '01')).toBe(true);
    expect(annotations.isBookmarked('math', '02')).toBe(false);
    expect(annotations.isBookmarked('physics', '01')).toBe(false);
  });
});
