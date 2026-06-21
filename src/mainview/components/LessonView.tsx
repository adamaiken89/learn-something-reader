import { useState, useEffect, useRef, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { api } from "../api";
import { useSettingsStore } from "../stores/settingsStore";
import type { Theme } from "../stores/settingsStore";

interface ModuleMeta {
  id: number;
  name: string;
  timeHours: number;
  prerequisites: number[];
}

interface Section {
  id: string;
  heading: string;
  level: number;
  parentID: string | null;
}

interface Props {
  subjectId: string;
  module: ModuleMeta;
  onStartQuiz: () => void;
}

function extractText(children: ReactNode): string {
  let text = "";
  const walk = (node: ReactNode) => {
    if (typeof node === "string") text += node;
    else if (Array.isArray(node)) node.forEach(walk);
    else if (node && typeof node === "object" && "props" in node) {
      walk((node as { props: { children: ReactNode } }).props.children);
    }
  };
  walk(children);
  return text;
}

function headingId(children: ReactNode): string {
  return extractText(children)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[:,()]/g, "")
    .replace(/[^a-z0-9-]/g, "");
}

const headingRenderer = (level: number) =>
  function Heading({ children }: { children: ReactNode }) {
    const id = headingId(children);
    const Tag = `h${level}` as keyof JSX.IntrinsicElements;
    return <Tag id={id}>{children}</Tag>;
  };

const components = {
  h1: headingRenderer(1),
  h2: headingRenderer(2),
  h3: headingRenderer(3),
  h4: headingRenderer(4),
  h5: headingRenderer(5),
  h6: headingRenderer(6),
};

const THEMES: Theme[] = ["dark", "sepia", "light"];
const THEME_LABELS: Record<Theme, string> = { dark: "Dark", sepia: "Sepia", light: "Light" };
const THEME_ICONS: Record<Theme, string> = { dark: "🌙", sepia: "📜", light: "☀️" };

export default function LessonView({ subjectId, module, onStartQuiz }: Props) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<Section[]>([]);
  const [visibleSection, setVisibleSection] = useState<string | null>(null);
  const [showTOC, setShowTOC] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const fontSize = useSettingsStore((s) => s.fontSize);
  const theme = useSettingsStore((s) => s.theme);
  const incFontSize = useSettingsStore((s) => s.incFontSize);
  const decFontSize = useSettingsStore((s) => s.decFontSize);
  const cycleTheme = useSettingsStore((s) => s.cycleTheme);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.subjects.lesson(subjectId, module.id),
      api.subjects.sections(subjectId, module.id),
      api.storage.notes(subjectId, module.id),
    ]).then(([lesson, secs, nts]) => {
      setContent(lesson.content);
      setSections(secs);
      setNotes(nts);
      setLoading(false);
    }).catch(() => setLoading(false));
    api.storage.moduleBookmarks(subjectId, module.id).then(setBookmarks).catch(() => setBookmarks([]));
  }, [subjectId, module.id]);

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;
    setAiThinking(true);
    setAiResponse("");
    try {
      const result = await api.gemini.ask(aiQuestion, content.slice(0, 4000));
      setAiResponse(result.response);
    } catch (err) {
      setAiResponse(`Error: ${(err as Error).message}`);
    }
    setAiThinking(false);
  };

  const sectionBookmark = bookmarks.find((b) => b.sectionID === visibleSection);
  const moduleBookmark = bookmarks.find((b) => !b.sectionID);
  const hasActiveBookmark = visibleSection ? !!sectionBookmark : !!moduleBookmark;
  const activeBookmarkId = visibleSection
    ? sectionBookmark?.id
    : moduleBookmark?.id;

  const handleToggleBookmark = async () => {
    if (hasActiveBookmark && activeBookmarkId) {
      await api.storage.deleteBookmark(activeBookmarkId);
      setBookmarks((prev) => prev.filter((b) => b.id !== activeBookmarkId));
    } else {
      const title = visibleSection
        ? `${module.name} – ${sections.find((s) => s.id === visibleSection)?.heading}`
        : module.name;
      const bookmark = await api.storage.addBookmark({
        subjectID: subjectId,
        moduleID: module.id,
        title,
        sectionID: visibleSection,
        scrollPosition: contentRef.current?.scrollTop || 0,
      });
      setBookmarks((prev) => [...prev, bookmark]);
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    await api.storage.deleteBookmark(id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleScroll = () => {
    if (!contentRef.current || sections.length === 0) return;
    const headings = contentRef.current.querySelectorAll("h1, h2, h3, h4, h5, h6");
    let currentId: string | null = null;
    headings.forEach((h) => {
      const rect = h.getBoundingClientRect();
      if (rect.top < 150) currentId = h.id;
    });
    setVisibleSection(currentId);
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollSection = (dir: "prev" | "next") => {
    if (!visibleSection) return;
    const idx = sections.findIndex((s) => s.id === visibleSection);
    const target = dir === "next" ? idx + 1 : idx - 1;
    if (target >= 0 && target < sections.length) scrollToSection(sections[target].id);
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading lesson...</div>;

  const hasPrevSection = sections.length > 0 && visibleSection !== null && sections.findIndex((s) => s.id === visibleSection) > 0;
  const hasNextSection = sections.length > 0 && visibleSection !== null && sections.findIndex((s) => s.id === visibleSection) < sections.length - 1;

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-1.5 flex items-center gap-2 shrink-0">
          <button onClick={decFontSize} className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded" title="Decrease font size">A-</button>
          <span className="text-xs text-gray-400 w-8 text-center">{fontSize}</span>
          <button onClick={incFontSize} className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded" title="Increase font size">A+</button>
          <div className="h-3 w-px bg-gray-600" />
          <button onClick={cycleTheme} className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded" title={`Theme: ${THEME_LABELS[theme]}`}>
            {THEME_ICONS[theme]}
          </button>
          <div className="h-3 w-px bg-gray-600" />
          <button onClick={() => setShowTOC(!showTOC)} className={`px-2 py-0.5 text-xs rounded ${showTOC ? "bg-indigo-600 text-white" : "bg-gray-700 hover:bg-gray-600"}`}>
            Sections
          </button>
          <div className="h-3 w-px bg-gray-600" />
          <button onClick={() => scrollSection("prev")} disabled={!hasPrevSection} className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-30">↑ Sec</button>
          <button onClick={() => scrollSection("next")} disabled={!hasNextSection} className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-30">↓ Sec</button>
          <div className="h-3 w-px bg-gray-600" />
          <button onClick={() => setShowSidebar(!showSidebar)} className={`px-2 py-0.5 text-xs rounded ${showSidebar ? "bg-indigo-600 text-white" : "bg-gray-700 hover:bg-gray-600"}`}>
            Notes ({notes.length})
          </button>
          <button onClick={() => setShowAI(!showAI)} className={`px-2 py-0.5 text-xs rounded ${showAI ? "bg-indigo-600 text-white" : "bg-gray-700 hover:bg-gray-600"}`}>
            Ask AI
          </button>
          <div className="h-3 w-px bg-gray-600" />
          <button
            onClick={handleToggleBookmark}
            className={`px-2 py-0.5 text-xs rounded ${
              hasActiveBookmark
                ? "bg-amber-600 text-white"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            title={visibleSection ? "Bookmark this section" : "Bookmark this module"}
          >
            {hasActiveBookmark ? "★" : "☆"} Bookmark
          </button>
          <div className="flex-1" />
          <button onClick={onStartQuiz} className="px-3 py-0.5 text-xs bg-emerald-700 hover:bg-emerald-600 rounded">
            Quiz
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6" ref={contentRef} onScroll={handleScroll}>
          <div className={`book-content book-${theme}`} style={{ fontSize: `${fontSize}px` }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={components}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {showTOC && (
        <aside className="w-56 bg-gray-850 border-l border-gray-700 overflow-y-auto p-3 shrink-0">
          <h3 className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">Sections</h3>
          {sections.length === 0 && <p className="text-xs text-gray-500">No sections found.</p>}
          {sections.map((section) => {
            const secBm = bookmarks.find((b) => b.sectionID === section.id);
            return (
              <div key={section.id} className="flex items-center group">
                <button
                  onClick={() => scrollToSection(section.id)}
                  className={`flex-1 text-left py-1 pr-1 text-xs rounded transition-colors ${
                    visibleSection === section.id
                      ? "bg-indigo-600/20 text-indigo-300 border-l-2 border-indigo-400"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800 border-l-2 border-transparent"
                  }`}
                  style={{ paddingLeft: `${12 + (section.level - 1) * 16}px` }}
                >
                  {section.heading}
                </button>
                <button
                  onClick={async () => {
                    if (secBm) {
                      await handleDeleteBookmark(secBm.id);
                    } else {
                      const bookmark = await api.storage.addBookmark({
                        subjectID: subjectId,
                        moduleID: module.id,
                        title: `${module.name} – ${section.heading}`,
                        sectionID: section.id,
                        scrollPosition: 0,
                      });
                      setBookmarks((prev) => [...prev, bookmark]);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 px-1 text-xs text-gray-500 hover:text-amber-400 transition-all"
                  title={secBm ? "Remove section bookmark" : "Bookmark this section"}
                >
                  {secBm ? "★" : "☆"}
                </button>
              </div>
            );
          })}
        </aside>
      )}

      {showSidebar && (
        <aside className="w-64 bg-gray-850 border-l border-gray-700 overflow-y-auto p-3 shrink-0">
          <h3 className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">Notes ({notes.length})</h3>
          {notes.length === 0 && <p className="text-xs text-gray-500">No notes yet.</p>}
          {notes.map((note) => (
            <div key={note.id} className="bg-gray-800 rounded p-2 mb-1.5">
              <p className="text-xs text-gray-300">{note.content}</p>
              <p className="text-xs text-gray-600 mt-0.5">{new Date(note.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </aside>
      )}

      {showAI && (
        <aside className="w-72 bg-gray-850 border-l border-gray-700 overflow-y-auto p-3 shrink-0 flex flex-col">
          <h3 className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">Ask AI</h3>
          <textarea
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            placeholder="Ask about this lesson..."
            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-xs text-gray-200 placeholder-gray-500 resize-none h-16 mb-1.5"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAskAI(); } }}
          />
          <button
            onClick={handleAskAI}
            disabled={aiThinking || !aiQuestion.trim()}
            className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 rounded disabled:opacity-50 mb-2"
          >
            {aiThinking ? "Thinking..." : "Ask"}
          </button>
          {aiResponse && (
            <div className="bg-gray-800 rounded p-2 text-xs text-gray-300 whitespace-pre-wrap">
              {aiResponse}
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
