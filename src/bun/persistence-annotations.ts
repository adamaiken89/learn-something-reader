import type { Highlight, Note, Bookmark } from './types';
import { load, save } from './persistence';

export function getHighlightsForModule(courseID: string, moduleID: string): Highlight[] {
  const data = load();
  return data.highlights
    .filter((h) => h.courseID === courseID && h.moduleID === moduleID)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function addHighlight(
  courseID: string,
  moduleID: string,
  selectedText: string,
  startOffset: number,
  endOffset: number,
  color: string = 'yellow',
  sectionID?: string | null,
): Highlight {
  const data = load();
  const existing = data.highlights.find(
    (h) =>
      h.courseID === courseID &&
      h.moduleID === moduleID &&
      h.selectedText === selectedText &&
      h.startOffset === startOffset &&
      h.endOffset === endOffset,
  );
  if (existing) {
    existing.color = color;
    if (sectionID !== undefined) existing.sectionID = sectionID;
    save(data);
    return existing;
  }
  const highlight: Highlight = {
    id: crypto.randomUUID(),
    courseID,
    moduleID,
    selectedText,
    startOffset,
    endOffset,
    color,
    createdAt: new Date().toISOString(),
    sectionID: sectionID ?? null,
  };
  data.highlights.push(highlight);
  save(data);
  return highlight;
}

export function deleteHighlight(id: string): void {
  const data = load();
  data.highlights = data.highlights.filter((h) => h.id !== id);
  save(data);
}

export function addNote(
  courseID: string,
  moduleID: string,
  content: string,
  highlightID?: string,
  sectionID?: string,
): Note {
  const data = load();
  const now = new Date().toISOString();
  const note: Note = {
    id: crypto.randomUUID(),
    courseID,
    moduleID,
    highlightID: highlightID || null,
    sectionID: sectionID || null,
    content,
    createdAt: now,
    updatedAt: now,
  };
  data.notes.push(note);
  save(data);
  return note;
}

export function getNotesForModule(courseID: string, moduleID: string): Note[] {
  const data = load();
  return data.notes
    .filter((n) => n.courseID === courseID && n.moduleID === moduleID)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function updateNote(id: string, content: string): void {
  const data = load();
  const note = data.notes.find((n) => n.id === id);
  if (note) {
    note.content = content;
    note.updatedAt = new Date().toISOString();
    save(data);
  }
}

export function deleteNote(id: string): void {
  const data = load();
  data.notes = data.notes.filter((n) => n.id !== id);
  save(data);
}

export function addAnnotation(data: {
  courseID: string;
  moduleID: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  color: string;
  noteContent: string;
}): { highlight: Highlight; note: Note } {
  const highlight = addHighlight(
    data.courseID,
    data.moduleID,
    data.selectedText,
    data.startOffset,
    data.endOffset,
    data.color,
  );
  const note = addNote(data.courseID, data.moduleID, data.noteContent, highlight.id, undefined);
  return { highlight, note };
}

export function addBookmark(
  courseID: string,
  moduleID: string,
  title: string,
  sectionID?: string,
  extras?: { kind?: Bookmark['kind']; snippet?: string },
): Bookmark {
  const data = load();
  const bookmark: Bookmark = {
    id: crypto.randomUUID(),
    courseID,
    moduleID,
    sectionID: sectionID || null,
    title,
    createdAt: new Date().toISOString(),
    kind: extras?.kind ?? (sectionID ? 'section' : 'module'),
    ...(extras?.snippet !== undefined ? { snippet: extras.snippet } : {}),
  };
  data.bookmarks.push(bookmark);
  save(data);
  return bookmark;
}

export function getAllBookmarks(): Bookmark[] {
  const data = load();
  return data.bookmarks.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getBookmarksForCourse(courseID: string): Bookmark[] {
  const data = load();
  return data.bookmarks
    .filter((b) => b.courseID === courseID)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getBookmarksForModule(courseID: string, moduleID: string): Bookmark[] {
  const data = load();
  return data.bookmarks
    .filter((b) => b.courseID === courseID && b.moduleID === moduleID)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function deleteBookmark(id: string): void {
  const data = load();
  data.bookmarks = data.bookmarks.filter((b) => b.id !== id);
  save(data);
}

export function isBookmarked(courseID: string, moduleID: string): boolean {
  const data = load();
  return data.bookmarks.some((b) => b.courseID === courseID && b.moduleID === moduleID);
}
