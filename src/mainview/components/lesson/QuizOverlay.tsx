import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { QuizIndex } from '../../../bun/types';
import { api } from '../../api';
import { useCurrentLesson } from '../../hooks/useCurrentLesson';
import { useViewStore } from '../../stores/viewStore';

interface Props {
  onClose: () => void;
}

export default function QuizOverlay({ onClose }: Props) {
  const { t } = useTranslation();
  const { course, module: currentModule } = useCurrentLesson();
  const push = useViewStore((s) => s.push);
  const [index, setIndex] = useState<QuizIndex | null>(null);

  useEffect(() => {
    if (course) {
      api.quiz
        .index(course.id)
        .then(setIndex)
        .catch(() => {});
    }
  }, [course]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  if (!course || !index) return null;

  const moduleEntries = Object.entries(index.modules).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16"
      onKeyDown={handleKeyDown}
    >
      <div className="fixed inset-0 bg-black/60" onClick={onClose} data-testid="overlay-backdrop" />
      <div className="relative bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-md max-h-[70vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-200">{course.displayName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {moduleEntries.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-700/50">
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">
              {t('quiz.modules', 'Module Quizzes')}
            </p>
            <div className="space-y-1">
              {moduleEntries.map(([dirName, types]) => {
                const parts = dirName.split('-');
                const num = parts[0];
                const name = parts.slice(1).join(' ');
                const mod = course.modules.find((m) => m.id === num);
                const displayName = mod?.name || name;
                return (
                  <div
                    key={dirName}
                    className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-700/40 text-xs"
                  >
                    <span className="text-gray-300 truncate mr-2">
                      {num && <span className="text-gray-500 mr-1">{num}</span>}
                      {displayName}
                    </span>
                    <span className="flex gap-1 shrink-0">
                      {types.mcq && (
                        <button
                          onClick={() => {
                            if (mod) {
                              push({ type: 'quiz', course, module: mod });
                              onClose();
                            }
                          }}
                          className="px-2 py-0.5 text-[10px] font-medium rounded bg-indigo-600/30 text-indigo-300 hover:bg-indigo-500/50 transition-colors"
                        >
                          MCQ
                        </button>
                      )}
                      {types.cloze && mod && (
                        <button
                          onClick={() => {
                            push({ type: 'clozeQuiz', course, module: mod });
                            onClose();
                          }}
                          className="px-2 py-0.5 text-[10px] font-medium rounded bg-indigo-600/30 text-indigo-300 hover:bg-indigo-500/50 transition-colors"
                        >
                          Cloze
                        </button>
                      )}
                      {mod === currentModule && (
                        <span className="text-[9px] text-indigo-400 ml-0.5 self-center">●</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {index.cumulativeQuizzes.length > 0 && (
          <div className="px-4 py-3">
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">
              {t('quiz.cumulativeTitle', 'Cumulative Reviews')}
            </p>
            <div className="space-y-1">
              {index.cumulativeQuizzes.map((cq) => (
                <div
                  key={cq.id}
                  className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-700/40 text-xs"
                >
                  <span className="text-gray-300">
                    {(() => {
                      const range = cq.id.match(/^cumulative_quiz_(\d+)-(\d+).yaml$/);
                      if (range)
                        return `Cumulative (${range[1].padStart(2, '0')}–${range[2].padStart(2, '0')})`;
                      const single = cq.id.match(/^cumulative_quiz_(\d+).yaml$/);
                      if (single) return `Cumulative (01–${single[1].padStart(2, '0')})`;
                      return `Cumulative (01–${String(cq.milestone).padStart(2, '0')})`;
                    })()}
                  </span>
                  <button
                    onClick={() => {
                      push({
                        type: 'cumulativeQuiz',
                        course,
                        cumulativeQuizId: cq.id,
                      });
                      onClose();
                    }}
                    className="px-2 py-0.5 text-[10px] font-medium rounded bg-indigo-600/30 text-indigo-300 hover:bg-indigo-500/50 transition-colors"
                  >
                    START
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {moduleEntries.length === 0 && index.cumulativeQuizzes.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            {t('quiz.noQuizzes', 'No quizzes available for this course.')}
          </div>
        )}
      </div>
    </div>
  );
}
