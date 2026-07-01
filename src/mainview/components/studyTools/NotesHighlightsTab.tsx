import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Highlight } from '../../../bun/types';
import { useHighlightsStore } from '../../stores/highlightsStore';
import { useLessonUIStore } from '../../stores/lessonUIStore';
import { useLessonViewStore } from '../../stores/lessonViewStore';
import { useNotesStore } from '../../stores/notesStore';
import { useViewStore } from '../../stores/viewStore';
import { showToast } from '../../toast';
import HighlightItem from './HighlightItem';
import NoteEditor from './NoteEditor';
import NoteItem from './NoteItem';
import { scrollToHighlightEl } from './notesHelpers';

type MergedItem =
  | { kind: 'highlight'; highlight: Highlight }
  | {
      kind: 'note';
      note: {
        id: string;
        content: string;
        sectionID: string | null;
        highlightID: string | null;
        createdAt: string;
      };
      linkedHighlight?: Highlight;
    };

export default function NotesHighlightsTab() {
  const { t } = useTranslation();
  const visibleSection = useLessonUIStore((s) => s.visibleSection);

  const views = useViewStore((s) => s.views);
  const lastView = views[views.length - 1];
  const courseId = lastView?.type === 'lesson' ? lastView.course.id : '';
  const moduleId = lastView?.type === 'lesson' ? lastView.module.id : '';

  const { contentRef, scrollToSection, sections } = useLessonViewStore();

  const loadNotes = useNotesStore((s) => s.load);
  const addNote = useNotesStore((s) => s.add);
  const updateNote = useNotesStore((s) => s.update);
  const removeNote = useNotesStore((s) => s.remove);
  const notesByModule = useNotesStore((s) => s.byModule);
  const notesLoading = useNotesStore((s) => s.loading[`${courseId}:${moduleId}`] ?? false);

  const highlightsByModule = useHighlightsStore((s) => s.byModule);
  const removeHighlight = useHighlightsStore((s) => s.remove);

  const k = `${courseId}:${moduleId}`;

  useEffect(() => {
    if (courseId && moduleId) void loadNotes(courseId, moduleId);
  }, [courseId, moduleId, loadNotes]);

  const [newNoteContent, setNewNoteContent] = useState('');

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;
    await addNote({
      courseID: courseId,
      moduleID: moduleId,
      content: newNoteContent.trim(),
      sectionID: visibleSection ?? undefined,
    });
    setNewNoteContent('');
    showToast.success('toast.saved');
  };

  const handleUpdateNote = async (id: string, content: string) => {
    await updateNote(id, content);
    showToast.success('toast.saved');
  };

  const handleDeleteNote = async (id: string) => {
    await removeNote(id);
    showToast.success('toast.deleted');
  };

  const handleDeleteHighlight = useCallback(
    async (id: string) => {
      await removeHighlight(id);
      showToast.success('toast.deleted');
    },
    [removeHighlight],
  );

  const mergedItems = useMemo<MergedItem[]>(() => {
    const notes = notesByModule[k] ?? [];
    const highlights = highlightsByModule[k] ?? [];
    const items: MergedItem[] = [];
    for (const h of highlights) items.push({ kind: 'highlight', highlight: h });
    for (const n of notes) {
      const linkedH = n.highlightID ? highlights.find((h) => h.id === n.highlightID) : undefined;
      items.push({ kind: 'note', note: n, linkedHighlight: linkedH });
    }
    items.sort((a, b) => {
      const aTime = a.kind === 'highlight' ? a.highlight.createdAt : a.note.createdAt;
      const bTime = b.kind === 'highlight' ? b.highlight.createdAt : b.note.createdAt;
      return new Date(aTime).getTime() - new Date(bTime).getTime();
    });
    return items;
  }, [notesByModule, highlightsByModule, k]);

  const handleNavigate = (item: MergedItem) => {
    if (item.kind === 'highlight') {
      scrollToHighlightEl(contentRef, item.highlight.id);
    } else {
      if (item.linkedHighlight) {
        const scrolled = scrollToHighlightEl(contentRef, item.linkedHighlight.id);
        if (scrolled) return;
      }
      if (item.note.sectionID) scrollToSection(item.note.sectionID);
    }
  };

  return (
    <div className="space-y-3">
      <NoteEditor value={newNoteContent} onChange={setNewNoteContent} onSave={handleAddNote} />
      {notesLoading ? (
        <p className="text-xs text-gray-500">{t('studyTools.loadingNotes')}</p>
      ) : mergedItems.length === 0 ? (
        <p className="text-xs text-gray-500">{t('studyTools.noNotesOrHighlights')}</p>
      ) : (
        mergedItems.map((item) => (
          <div
            key={item.kind === 'highlight' ? `h-${item.highlight.id}` : `n-${item.note.id}`}
            className="bg-gray-800 border border-gray-700 rounded p-2 cursor-pointer hover:bg-gray-750 transition-colors"
            onClick={() => handleNavigate(item)}
          >
            {item.kind === 'highlight' ? (
              <HighlightItem
                highlight={item.highlight}
                contentRef={contentRef}
                sections={sections}
                onDelete={handleDeleteHighlight}
              />
            ) : (
              <NoteItem
                note={item.note}
                linkedHighlight={item.linkedHighlight}
                sections={sections}
                onUpdate={handleUpdateNote}
                onDelete={handleDeleteNote}
              />
            )}
          </div>
        ))
      )}
    </div>
  );
}
