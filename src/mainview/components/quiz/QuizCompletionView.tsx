import { cva } from 'class-variance-authority';
import clsx from 'clsx';
import { ArrowRight, Check, Lightbulb, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { QuizQuestion, StudySession } from '../../../bun/types';

const completionBtn = cva('px-5 py-2.5 rounded-[10px] text-sm font-medium transition-colors', {
  variants: {
    color: {
      primary: 'bg-indigo-600 hover:bg-indigo-500',
      secondary: 'bg-gray-600 hover:bg-gray-500',
      tertiary: 'bg-gray-700 hover:bg-gray-600',
      success: 'bg-emerald-600 hover:bg-emerald-500',
    },
  },
});

const CONFETTI_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6'];
const CIRCUMFERENCE = 2 * Math.PI * 54;

interface QuestionResult {
  question: QuizQuestion;
  isCorrect: boolean;
  userAnswer: string | undefined;
  /** Per-blank correctness for cloze questions (undefined for mcq/tf). */
  blankResults?: boolean[];
  /** Expected answer per blank for cloze questions. */
  expectedAnswers?: string[];
}

interface Props {
  score: number;
  total: number;
  previousSession: StudySession | null;
  questionResults: QuestionResult[];
  onRetry: () => void;
  onBackToLesson?: () => void;
  onNextChapter?: () => void;
  onBackToDashboard?: () => void;
  onNextQuiz?: () => void;
}

export default function QuizCompletionView({
  score,
  total,
  previousSession,
  questionResults,
  onRetry,
  onBackToLesson,
  onNextChapter,
  onBackToDashboard,
  onNextQuiz,
}: Props) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'correct' | 'wrong'>('all');
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const isPerfect = percentage === 100;

  const correctCount = questionResults.filter((r) => r.isCorrect).length;
  const wrongCount = questionResults.length - correctCount;

  const filteredResults = (() => {
    if (filter === 'correct') return questionResults.filter((r) => r.isCorrect);
    if (filter === 'wrong') return questionResults.filter((r) => !r.isCorrect);
    return questionResults;
  })();

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {isPerfect && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="anim-confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                width: `${6 + Math.random() * 6}px`,
                height: `${6 + Math.random() * 6}px`,
                backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                animationDuration: `${0.8 + Math.random() * 0.7}s`,
                animationDelay: `${Math.random() * 0.5}s`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }}
            />
          ))}
        </div>
      )}
      <div className="quiz-container-card p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">{t('quiz.quizComplete')}!</h2>
        <div className="flex justify-center mb-2">
          <svg width="140" height="140" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="rgba(99,102,241,0.15)"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#6366f1"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE}
              className="score-ring"
              transform="rotate(-90 60 60)"
            />
            <text
              x="60"
              y="60"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#e0e7ff"
              fontSize="28"
              fontWeight="bold"
              fontFamily="system-ui"
            >
              {percentage}%
            </text>
          </svg>
        </div>
        <p className="text-gray-400 mb-4">{t('quiz.scoreLine', { score, total })}</p>
        {previousSession?.score !== undefined && previousSession.total && (
          <div className="flex items-center justify-center gap-1.5 mb-5">
            <span
              className={clsx(
                'text-xs font-semibold px-2 py-0.5 rounded-full',
                previousSession.score / previousSession.total >= 0.8
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-rose-400 bg-rose-500/10',
              )}
            >
              {previousSession.score / previousSession.total >= 0.8
                ? `✓ ${t('quiz.previousPassed')}`
                : `✗ ${t('quiz.previousFailed')}`}
            </span>
          </div>
        )}
        <div className="flex gap-2 mb-6 justify-center">
          {(['all', 'wrong', 'correct'] as const).map((f) => {
            const count =
              f === 'all' ? questionResults.length : f === 'wrong' ? wrongCount : correctCount;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  'px-3 py-1 text-xs rounded-lg font-medium transition-colors',
                  filter === f
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                    : 'text-gray-500 hover:text-gray-300 border border-gray-700/50',
                )}
              >
                {t(`quiz.filter${f.charAt(0).toUpperCase() + f.slice(1)}`, {
                  count,
                  defaultValue: `${f.charAt(0).toUpperCase() + f.slice(1)} (${count})`,
                })}
              </button>
            );
          })}
        </div>
        <div className="space-y-3">
          {filteredResults.map(
            ({ question: q, isCorrect, userAnswer, blankResults, expectedAnswers }) => (
              <div
                key={q.id}
                className={clsx(
                  'text-left p-4 rounded-[10px] text-sm border',
                  isCorrect
                    ? 'border-emerald-500/20 bg-emerald-500/[0.03]'
                    : 'border-rose-500/30 bg-rose-500/[0.04]',
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={clsx(
                      'text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1',
                      isCorrect
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400',
                    )}
                  >
                    {isCorrect ? <Check size={12} /> : <X size={12} />}
                    {isCorrect
                      ? t('quiz.correctLabel', 'Correct')
                      : t('quiz.incorrectLabel', 'Incorrect')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {t('quiz.yourAnswer')} {userAnswer}. {t('quiz.correctAnswer')} {q.answer}
                  </span>
                </div>
                <p className="font-medium text-sm text-gray-100 mb-3">{q.question}</p>
                {blankResults &&
                  expectedAnswers &&
                  blankResults.length === expectedAnswers.length && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {blankResults.map((ok, i) => (
                        <span
                          key={i}
                          className={clsx(
                            'text-xs font-medium px-2 py-0.5 rounded-md inline-flex items-center gap-1',
                            ok
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400',
                          )}
                        >
                          {ok ? <Check size={10} /> : <X size={10} />}
                          {expectedAnswers[i]}
                        </span>
                      ))}
                    </div>
                  )}
                {q.explanation && (
                  <div className="pt-3 border-t border-gray-700/50 text-sm text-gray-400 leading-relaxed">
                    <span className="font-medium text-gray-300 inline-flex items-center gap-1">
                      <Lightbulb size={14} /> {t('quiz.explanation', 'Explanation')}:
                    </span>{' '}
                    {q.explanation}
                  </div>
                )}
              </div>
            ),
          )}
        </div>
        <div className="flex gap-3 mt-6 justify-center flex-wrap">
          <button onClick={onRetry} className={completionBtn({ color: 'primary' })}>
            {t('quiz.retry')}
          </button>
          {onBackToLesson ? (
            <button onClick={onBackToLesson} className={completionBtn({ color: 'secondary' })}>
              {t('quiz.backToLesson')}
            </button>
          ) : onBackToDashboard ? (
            <button onClick={onBackToDashboard} className={completionBtn({ color: 'tertiary' })}>
              {t('quiz.backToDashboard')}
            </button>
          ) : null}
          {onNextQuiz ? (
            <button onClick={onNextQuiz} className={completionBtn({ color: 'success' })}>
              {t('quiz.nextQuiz')} <ArrowRight size={14} className="inline" />
            </button>
          ) : onNextChapter ? (
            <button onClick={onNextChapter} className={completionBtn({ color: 'success' })}>
              {t('quiz.nextChapter')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
