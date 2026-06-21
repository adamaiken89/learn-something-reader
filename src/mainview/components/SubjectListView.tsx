import { useState, useEffect } from "react";
import { api } from "../api";

interface Subject {
  id: string;
  subject: string;
  displayName: string;
  modules: { id: number; name: string; timeHours: number }[];
  timeBudgetHours: number;
  targetLevel: string;
  learningObjectives: string[];
}

interface Props {
  onSelectSubject: (subject: Subject) => void;
  onOpenSettings: () => void;
  onOpenBookmarks: () => void;
}

export default function SubjectListView({ onSelectSubject, onOpenSettings, onOpenBookmarks }: Props) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.subjects.list()
      .then(setSubjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading subjects...</div>;
  if (error) return <div className="p-8 text-center text-red-400">Error: {error}</div>;

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-indigo-400">CourseReader</h1>
          <p className="text-sm text-gray-400 mt-0.5">Desktop study app</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onOpenBookmarks}
            className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Bookmarks
          </button>
          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Settings
          </button>
        </div>
      </header>

      <main className="px-6 py-8 overflow-y-auto flex-1">
        {subjects.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No subjects found. Add subjects to the subjects/ directory.
          </div>
        )}

        <div className="grid gap-4">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => onSelectSubject(subject)}
              className="text-left bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl p-5 transition-colors group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">
                    {subject.displayName}
                  </h2>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-400">
                    <span className="bg-gray-700 px-2 py-0.5 rounded">{subject.targetLevel}</span>
                    <span className="bg-gray-700 px-2 py-0.5 rounded">{subject.timeBudgetHours}h</span>
                    <span className="bg-gray-700 px-2 py-0.5 rounded">{subject.modules.length} modules</span>
                  </div>
                  {subject.learningObjectives.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {subject.learningObjectives.slice(0, 3).map((obj, i) => (
                        <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                          <span className="text-indigo-500 mt-0.5 shrink-0">→</span>
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <span className="text-gray-600 group-hover:text-indigo-400 ml-4 mt-1 shrink-0">→</span>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
