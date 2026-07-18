import { useLessonUIStore } from '../stores/lessonUIStore';

export function useScrollToSection(
  contentRef: React.RefObject<HTMLDivElement | null>,
): (sectionId: string) => void {
  return (sectionId: string) => {
    const container = contentRef.current;
    if (!container) return;
    const el = container.querySelector(`[id="${sectionId}"]`) as HTMLElement | null;
    if (!el) return;

    const offset =
      el.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop -
      20;

    useLessonUIStore.getState().setVisibleSection(sectionId);
    container.scrollTo({ top: offset });
    container.focus();
  };
}
