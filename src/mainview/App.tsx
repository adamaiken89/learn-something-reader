import { useState } from "react";
import SubjectListView from "./components/SubjectListView";
import LessonView from "./components/LessonView";
import QuizView from "./components/QuizView";
import ReviewView from "./components/ReviewView";
import SettingsView from "./components/SettingsView";
import { api } from "./api";
import { useViewStore, type Subject, type ModuleMeta, type View } from "./stores/viewStore";

interface Bookmark {
  id: string;
  subjectID: string;
  moduleID: number;
  title: string;
  createdAt: string;
}

export default function App() {
  const views = useViewStore((s) => s.views);
  const push = useViewStore((s) => s.push);
  const pop = useViewStore((s) => s.pop);
  const popToRoot = useViewStore((s) => s.popToRoot);
  const replace = useViewStore((s) => s.replace);

  const currentView = views[views.length - 1];

  const handleSelectSubject = async (subject: Subject) => {
    push({ type: "lesson", subject, module: subject.modules[0] });
  };

  const handleSelectModule = (subject: Subject, module: ModuleMeta) => {
    push({ type: "lesson", subject, module });
  };

  const handleStartQuiz = (subject: Subject, module: ModuleMeta) => {
    push({ type: "quiz", subject, module });
  };

  const handleStartReview = (subject: Subject) => {
    push({ type: "review", subject });
  };

  switch (currentView.type) {
    case "subjectList":
      return (
        <SubjectListView
          onSelectSubject={handleSelectSubject}
          onOpenSettings={() => push({ type: "settings" })}
          onOpenBookmarks={() => push({ type: "bookmarks" })}
        />
      );

    case "lesson":
      return (
        <LessonPage
          subject={currentView.subject}
          module={currentView.module}
          onBack={pop}
          onSelectModule={(m) => handleSelectModule(currentView.subject, m)}
          onStartQuiz={() => handleStartQuiz(currentView.subject, currentView.module)}
          onStartReview={() => handleStartReview(currentView.subject)}
        />
      );

    case "quiz":
      return (
        <QuizView
          subjectId={currentView.subject.id}
          moduleId={currentView.module.id}
          onBack={pop}
        />
      );

    case "review":
      return (
        <ReviewView
          subjectId={currentView.subject.id}
          onBack={pop}
        />
      );

    case "settings":
      return <SettingsView onBack={pop} />;

    case "bookmarks":
      return <BookmarksView onBack={pop} onOpen={(subjectID, moduleID, subjects) => {
        const subject = subjects.find((s: Subject) => s.id === subjectID);
        const module = subject?.modules.find((m) => m.id === moduleID);
        if (subject && module) {
          popToRoot();
          push({ type: "lesson", subject, module });
        }
      }} />;
  }
}

function LessonPage({
  subject, module, onBack, onSelectModule, onStartQuiz, onStartReview,
}: {
  subject: Subject;
  module: ModuleMeta;
  onBack: () => void;
  onSelectModule: (m: ModuleMeta) => void;
  onStartQuiz: () => void;
  onStartReview: () => void;
}) {
  const [showNav, setShowNav] = useState(false);
  const currentIdx = subject.modules.findIndex((m) => m.id === module.id);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < subject.modules.length - 1;

  return (
    <div className="flex h-screen bg-gray-900">
      {showNav && (
        <aside className="w-64 bg-gray-850 border-r border-gray-700 overflow-y-auto shrink-0">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-sm font-semibold text-indigo-400">{subject.displayName}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{subject.modules.length} modules</p>
          </div>
          <div className="p-2">
            {subject.modules.map((m, i) => (
              <button
                key={m.id}
                onClick={() => { onSelectModule(m); setShowNav(false); }}
                className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                  m.id === module.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/50"
                    : "text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                }`}
              >
                <span className={`text-xs mr-2 ${m.id === module.id ? "text-indigo-200" : "text-gray-500"}`}>{String(i + 1).padStart(2, "0")}</span>
                <span className="break-words">{m.name}</span>
              </button>
            ))}
          </div>
        </aside>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">← Back</button>
            <div className="h-4 w-px bg-gray-600" />
            <button onClick={() => setShowNav(!showNav)} className={`px-2 py-1 text-xs rounded ${showNav ? "bg-indigo-600" : "bg-gray-700 hover:bg-gray-600"}`}>
              Modules
            </button>
          </div>
          <div className="flex-1 text-center">
            <span className="text-sm font-medium truncate inline-block max-w-md">{module.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {hasPrev && (
              <button onClick={() => onSelectModule(subject.modules[currentIdx - 1])} className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded">← Prev</button>
            )}
            {hasNext && (
              <button onClick={() => onSelectModule(subject.modules[currentIdx + 1])} className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded">Next →</button>
            )}
            <div className="h-4 w-px bg-gray-600" />
            <button onClick={onStartReview} className="px-3 py-1 text-sm bg-amber-700 hover:bg-amber-600 rounded transition-colors">
              Review
            </button>
          </div>
        </header>

        <LessonView
          subjectId={subject.id}
          module={module}
          onBack={onBack}
          onStartQuiz={onStartQuiz}
        />
      </div>
    </div>
  );
}

function BookmarksView({ onBack, onOpen }: {
  onBack: () => void;
  onOpen: (subjectID: string, moduleID: number, subjects: Subject[]) => void;
}) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    Promise.all([
      api.storage.bookmarks(),
      api.subjects.list(),
    ]).then(([bks, subs]) => {
      setBookmarks(bks);
      setSubjects(subs);
      setLoading(false);
    });
  });

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await api.storage.deleteBookmark(id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading bookmarks...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">← Back</button>
        <h2 className="text-sm font-medium">Bookmarks ({bookmarks.length})</h2>
        <div className="w-16" />
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {bookmarks.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No bookmarks yet. Bookmark lessons while reading.</p>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((b) => {
              const subject = subjects.find((s: Subject) => s.id === b.subjectID);
              return (
                <div
                  key={b.id}
                  className="bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl transition-colors group relative"
                >
                  <button
                    onClick={() => onOpen(b.subjectID, b.moduleID, subjects)}
                    className="w-full text-left p-4 pr-10"
                  >
                    <h3 className="text-sm font-medium text-indigo-300">{b.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {subject?.displayName || b.subjectID}
                      {b.sectionID ? " — Section" : " — Module"}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">{new Date(b.createdAt).toLocaleDateString()}</p>
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, b.id)}
                    className="absolute right-4 mt-[-2.25rem] opacity-0 group-hover:opacity-100 px-2 py-0.5 text-xs bg-red-800 hover:bg-red-700 rounded transition-all"
                    title="Delete bookmark"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
