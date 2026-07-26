import type { DragEndEvent } from '@dnd-kit/dom';
import { DragDropProvider, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/react';
import clsx from 'clsx';
import { CornerDownLeft } from 'lucide-react';
import { useEffect, useEffectEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Course, ModuleMeta, QuizQuestion, StudySession } from '../../bun/types';
import { api } from '../api';
import QuizCompletionView from '../components/quiz/QuizCompletionView';
import { loadingIndicator } from '../components/ui/variants/loading';
import {
  progressSegmentClass,
  quizCompletionContainer,
  quizCtaButton,
  quizNavButton,
} from '../components/ui/variants/quiz';
import { useViewStore } from '../stores/viewStore';

interface Props {
  course: Course;
  module: ModuleMeta;
}

function parseClozeText(text: string): {
  segments: Array<{ type: 'text' | 'blank'; value: string }>;
  answers: string[];
} {
  const regex = /\{([^}]+)\}/g;
  const segments: Array<{ type: 'text' | 'blank'; value: string }> = [];
  const answers: string[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ type: 'text', value: text.slice(last, match.index) });
    }
    const term = match[1];
    if (term.toLowerCase() === 'blank') {
      segments.push({ type: 'blank', value: '' });
    } else {
      segments.push({ type: 'blank', value: term });
      answers.push(term);
    }
    last = regex.lastIndex;
  }
  if (last < text.length) {
    segments.push({ type: 'text', value: text.slice(last) });
  }
  return { segments, answers };
}

export function clozeAnswers(q: QuizQuestion): string[] {
  const parsed = parseClozeText(q.question).answers;
  return parsed.length > 0 ? parsed : [q.answer];
}

export function clozeCorrect(q: QuizQuestion, ua: string | undefined): boolean {
  if (ua === undefined) return false;
  const expected = clozeAnswers(q)
    .map((a) => a.trim().toLowerCase())
    .join(', ');
  return ua.trim().toLowerCase() === expected;
}

function DragToken({ id, label, isUsed }: { id: string; label: string; isUsed: boolean }) {
  const { ref, isDragging } = useDraggable({ id });
  if (isUsed) return null;
  return (
    <span
      ref={ref}
      className={clsx(
        'inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border cursor-grab transition-all select-none',
        isDragging
          ? 'opacity-40 border-indigo-500/50 bg-indigo-600/20 text-indigo-300'
          : 'border-gray-600/50 bg-gray-800/60 text-gray-300 hover:border-indigo-500/40 hover:text-indigo-200 hover:bg-gray-700/60',
      )}
    >
      {label}
    </span>
  );
}

function DropBlank({
  blankId,
  filledValue,
  isCorrect,
  isWrong,
}: {
  blankId: string;
  filledValue: string | undefined;
  isCorrect: boolean;
  isWrong: boolean;
}) {
  const { ref, isDropTarget } = useDroppable({ id: blankId });
  const isFilled = filledValue !== undefined;

  return (
    <span
      ref={ref}
      className={clsx(
        'inline-flex items-center min-w-[8em] mx-0.5 px-2 py-0.5 rounded border-b-2 transition-all font-medium',
        isDropTarget && !isFilled && 'border-emerald-400 bg-emerald-500/10',
        isFilled && isCorrect && 'border-emerald-500 bg-emerald-500/10 text-emerald-300',
        isFilled && isWrong && 'border-red-500 bg-red-500/10 text-red-300',
        !isFilled && !isDropTarget && 'border-indigo-500/40 bg-indigo-500/5',
      )}
    >
      {isFilled ? <span>{filledValue}</span> : <span>&nbsp;</span>}
    </span>
  );
}

export default function ClozeQuizSection({ course, module }: Props) {
  const { t } = useTranslation();
  const push = useViewStore((s) => s.push);
  const currentIdx = course.modules.findIndex((m) => m.id === module.id);
  const hasNext = currentIdx < course.modules.length - 1;
  const nextModule = hasNext ? course.modules[currentIdx + 1] : null;

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'loading' | 'ready' | 'completed'>('loading');
  const [filledBlanks, setFilledBlanks] = useState<Record<number, string>>({});
  const [wrongBlankIdx, setWrongBlankIdx] = useState<number | null>(null);
  const [previousSession, setPreviousSession] = useState<StudySession | null>(null);

  useEffect(() => {
    api.stats
      .lastQuizSession(course.id, module.id)
      .then(setPreviousSession)
      .catch(() => {});
  }, [course.id, module.id]);

  useEffect(() => {
    api.quiz
      .cloze(course.id, module.id)
      .then((qs) => {
        setQuestions(qs);
        setStatus('ready');
      })
      .catch(() => {
        setQuestions([]);
        setStatus('ready');
      });
  }, [course.id, module.id]);

  useEffect(() => {
    setFilledBlanks({});
    setWrongBlankIdx(null);
  }, [currentIndex]);

  const currentQuestion = questions[currentIndex];

  const { segments, answers: inlineAnswers } = currentQuestion
    ? parseClozeText(currentQuestion.question)
    : { segments: [], answers: [] };

  const questionAnswers = (() => {
    if (inlineAnswers.length > 0) return inlineAnswers;
    if (currentQuestion?.answer) return [currentQuestion.answer];
    return [];
  })();

  const tokenPool = (() => {
    if (!currentQuestion || questionAnswers.length === 0) return [];
    const distractors = questions.map((q) => q.answer).filter((a) => !questionAnswers.includes(a));
    const pool = [...questionAnswers, ...distractors.slice(0, 3)];
    return pool.sort(() => Math.random() - 0.5);
  })();

  const allBlanksFilled = questionAnswers.every((_, i) => filledBlanks[i] !== undefined);
  const hasAnswer = allBlanksFilled;

  const selectAnswer = (answer: string) => {
    const q = questions[currentIndex];
    if (!q) return;
    setSelectedAnswers((prev) => ({ ...prev, [q.id]: answer }));
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setStatus('completed');
    }
  };

  const retry = () => {
    setStatus('ready');
    setCurrentIndex(0);
    setSelectedAnswers({});
    setFilledBlanks({});
    setWrongBlankIdx(null);
  };

  const score = questions.filter((q) => clozeCorrect(q, selectedAnswers[q.id])).length;

  const handleDragEnd = (event: DragEndEvent) => {
    const { source, target } = event.operation;
    if (!source || !target || !currentQuestion) return;

    const draggedToken = String(source.id);
    const targetId = String(target.id);

    const blankIdxMatch = targetId.match(/^blank-(\d+)$/);
    if (!blankIdxMatch) return;
    const blankIdx = Number(blankIdxMatch[1]);

    const expectedAnswer = questionAnswers[blankIdx];
    if (expectedAnswer === undefined) return;

    if (draggedToken === expectedAnswer) {
      const newFilled = { ...filledBlanks, [blankIdx]: draggedToken };
      setFilledBlanks(newFilled);

      const fullAnswer = questionAnswers.map((a, i) => newFilled[i] || a).join(', ');
      selectAnswer(fullAnswer);
    } else {
      setWrongBlankIdx(blankIdx);
      setTimeout(() => setWrongBlankIdx(null), 600);
    }
  };

  const handleKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (status !== 'ready' || !currentQuestion) return;

    if ((e.key === 'Enter' || e.key === ' ') && hasAnswer) {
      e.preventDefault();
      nextQuestion();
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        setStatus('completed');
      }
    }
  });

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (status === 'loading') {
    return <div className={loadingIndicator()}>{t('quiz.loadingQuiz')}</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400">{t('quiz.noQuestions')}</p>
      </div>
    );
  }

  if (status === 'completed') {
    const questionResults = questions.map((q) => {
      const ua = selectedAnswers[q.id];
      return {
        question: q,
        isCorrect: clozeCorrect(q, ua),
        userAnswer: ua,
      };
    });

    return (
      <QuizCompletionView
        score={score}
        total={questions.length}
        previousSession={previousSession}
        questionResults={questionResults}
        onRetry={retry}
        onBackToLesson={() => push({ type: 'lesson', course, module })}
        onNextChapter={
          nextModule ? () => push({ type: 'lesson', course, module: nextModule }) : undefined
        }
        onBackToDashboard={!nextModule ? () => push({ type: 'dashboard' }) : undefined}
      />
    );
  }

  return (
    <div className={quizCompletionContainer()}>
      <DragDropProvider onDragEnd={handleDragEnd}>
        <div className="quiz-container-card p-6">
          <div className="flex justify-end mb-3">
            <span className="text-xs text-gray-500 font-medium tabular-nums">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>

          <div className="flex gap-1.5 mb-5">
            {questions.map((_, i) => (
              <div key={i} className={progressSegmentClass(i < currentIndex, i === currentIndex)} />
            ))}
          </div>

          <div key={currentIndex} className="question-entrance">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-medium bg-indigo-600/20 text-indigo-300 px-2 py-0.5 rounded-md">
                  Q{currentQuestion?.id}
                </span>
                <span className="text-[11px] text-gray-500">
                  {t('quiz.difficulty', { level: currentQuestion?.difficulty })}
                </span>
              </div>
              <h2 className="text-[20px] font-semibold text-white leading-relaxed tracking-tight">
                {segments.map((seg, i) =>
                  seg.type === 'text' ? (
                    <span key={i}>{seg.value}</span>
                  ) : (
                    (() => {
                      const blankIdx =
                        segments.slice(0, i + 1).filter((s) => s.type === 'blank').length - 1;
                      const answer = questionAnswers[blankIdx];
                      const filledValue = filledBlanks[blankIdx];
                      return (
                        <DropBlank
                          key={`blank-${blankIdx}`}
                          blankId={`blank-${blankIdx}`}
                          filledValue={filledValue}
                          isCorrect={filledValue !== undefined && filledValue === answer}
                          isWrong={wrongBlankIdx === blankIdx}
                        />
                      );
                    })()
                  ),
                )}
              </h2>
            </div>

            {tokenPool.length > 0 && (
              <div className="mb-5">
                <div className="flex flex-wrap gap-2 items-center">
                  {tokenPool.map((token) => (
                    <DragToken
                      key={token}
                      id={token}
                      label={token}
                      isUsed={Object.values(filledBlanks).includes(token)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {hasAnswer && currentQuestion?.explanation && (
            <div className="mb-5 animate-fade-in-up">
              <div className="bg-gray-800/40 rounded-[10px] p-4 border border-gray-700/30">
                <p className="text-sm text-gray-300 leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                if (currentIndex < questions.length - 1) {
                  setCurrentIndex((i) => i + 1);
                } else {
                  setStatus('completed');
                }
              }}
              className={quizNavButton()}
            >
              {t('quiz.skip')} <span className="text-[10px] text-gray-600 ml-0.5">[Esc]</span>
            </button>
            <button onClick={nextQuestion} disabled={!hasAnswer} className={quizCtaButton()}>
              {currentIndex < questions.length - 1 ? t('quiz.nextQuestion') : t('quiz.finishQuiz')}{' '}
              <span className="text-[10px] opacity-60 ml-1 inline-flex items-center">
                <CornerDownLeft size={10} />
              </span>
            </button>
          </div>
        </div>
        <DragOverlay>
          <span className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-indigo-500 bg-gray-900/90 text-indigo-200 shadow-lg">
            dragging
          </span>
        </DragOverlay>
      </DragDropProvider>
    </div>
  );
}
