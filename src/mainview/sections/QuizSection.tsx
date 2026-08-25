import { useEffect, useEffectEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { loadingIndicator } from '@/lib/loading';
import { quizCompletionContainer } from '@/lib/quiz-styles';

import type { Course, ModuleMeta, QuizIndex, StudySession } from '../../bun/types';
import { api } from '../api';
import QuizBottomNav from '../components/quiz/QuizBottomNav';
import QuizClozeInput from '../components/quiz/QuizClozeInput';
import QuizClozeQuestion from '../components/quiz/QuizClozeQuestion';
import QuizCompletionView from '../components/quiz/QuizCompletionView';
import QuizExplanation from '../components/quiz/QuizExplanation';
import QuizMCQGrid from '../components/quiz/QuizMCQGrid';
import QuizProgressBar from '../components/quiz/QuizProgressBar';
import { useQuizEngine } from '../hooks/useQuizEngine';
import { nextQuizAfter, presenceFromIndex, targetToView } from '../quizDrive';
import { clozeCorrect } from '../quizUtil';
import { useQuizStore } from '../stores/quizStore';
import { useViewStore } from '../stores/viewStore';

interface Props {
  course: Course;
  module: ModuleMeta;
}

export default function QuizSection({ course, module }: Props) {
  const { t } = useTranslation();
  const push = useViewStore((s) => s.push);
  const currentIdx = course.modules.findIndex((m) => m.id === module.id);
  const hasNext = currentIdx < course.modules.length - 1;
  const nextModule = hasNext ? course.modules[currentIdx + 1] : null;

  useQuizEngine(course.id, module.id);

  const status = useQuizStore((s) => s.status);
  const questions = useQuizStore((s) => s.questions);
  const currentIndex = useQuizStore((s) => s.currentIndex);
  const selectedAnswers = useQuizStore((s) => s.selectedAnswers);
  const currentQuestion = useQuizStore((s) => s.currentQuestion);
  const hasAnswer = useQuizStore((s) => s.hasAnswer);
  const score = useQuizStore((s) => s.score);
  const selectAnswer = useQuizStore((s) => s.selectAnswer);
  const nextQuestion = useQuizStore((s) => s.nextQuestion);
  const skipQuestion = useQuizStore((s) => s.skipQuestion);
  const retry = useQuizStore((s) => s.retry);
  const highlightedIdx = useQuizStore((s) => s.highlightedIdx);
  const setHighlightedIdx = useQuizStore((s) => s.setHighlightedIdx);
  const [previousSession, setPreviousSession] = useState<StudySession | null>(null);
  const [quizIndex, setQuizIndex] = useState<QuizIndex | null>(null);

  useEffect(() => {
    api.stats
      .lastQuizSession(course.id, module.id)
      .then(setPreviousSession)
      .catch(() => {});
  }, [course.id, module.id]);

  useEffect(() => {
    api.quiz
      .index(course.id)
      .then(setQuizIndex)
      .catch(() => {});
  }, [course.id]);

  const nextQuiz = quizIndex
    ? nextQuizAfter(course, presenceFromIndex(quizIndex), `module:${module.id}`)
    : null;

  const handleKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (status !== 'ready' || !currentQuestion) return;

    if (currentQuestion.type !== 'cloze') {
      const optionKeys = Object.keys(currentQuestion.options);
      const GRID_COLS = 2;

      const isForward = e.key === 'ArrowDown' || e.key === 'ArrowRight';
      const isBackward = e.key === 'ArrowUp' || e.key === 'ArrowLeft';

      if (isForward) {
        e.preventDefault();
        setHighlightedIdx((i) => {
          if (i < 0) return 0;
          if (e.key === 'ArrowRight') {
            const col = i % GRID_COLS;
            if (col + 1 >= GRID_COLS || i + 1 >= optionKeys.length) return i;
            return i + 1;
          }
          return i + GRID_COLS < optionKeys.length ? i + GRID_COLS : i;
        });
        return;
      }

      if (isBackward) {
        e.preventDefault();
        setHighlightedIdx((i) => {
          if (i < 0) return e.key === 'ArrowLeft' ? GRID_COLS - 1 : optionKeys.length - 1;
          if (e.key === 'ArrowLeft') {
            const col = i % GRID_COLS;
            if (col === 0) return i;
            return i - 1;
          }
          return i - GRID_COLS >= 0 ? i - GRID_COLS : i;
        });
        return;
      }

      if ((e.key === 'Enter' || e.key === ' ') && !hasAnswer && highlightedIdx >= 0) {
        e.preventDefault();
        selectAnswer(optionKeys[highlightedIdx]);
        return;
      }

      if (e.key.length === 1 && /^[A-D a-d]$/i.test(e.key)) {
        e.preventDefault();
        const key = e.key.toUpperCase();
        const idx = optionKeys.indexOf(key);
        if (idx >= 0) {
          setHighlightedIdx(idx);
          selectAnswer(key);
        }
        return;
      }
    }

    if ((e.key === 'Enter' || e.key === ' ') && hasAnswer) {
      e.preventDefault();
      nextQuestion();
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      skipQuestion();
    }
  });

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (status === 'loading')
    return <div className={loadingIndicator()}>{t('quiz.loadingQuiz')}</div>;
  if (questions.length === 0)
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400">{t('quiz.noQuestions')}</p>
      </div>
    );

  if (status === 'completed') {
    const questionResults = questions.map((q) => {
      const ua = selectedAnswers[q.id];
      const correct = q.type === 'cloze' ? clozeCorrect(q, ua) : ua === q.answer;
      return { question: q, isCorrect: correct, userAnswer: ua };
    });

    return (
      <QuizCompletionView
        score={score}
        total={questions.length}
        previousSession={previousSession}
        questionResults={questionResults}
        onRetry={retry}
        onBackToLesson={() => push({ type: 'lesson', course, module })}
        onNextQuiz={nextQuiz ? () => push(targetToView(course, nextQuiz)) : undefined}
        onNextChapter={
          !nextQuiz && nextModule
            ? () => push({ type: 'lesson', course, module: nextModule })
            : undefined
        }
        onBackToDashboard={!nextQuiz && !nextModule ? () => push({ type: 'dashboard' }) : undefined}
      />
    );
  }

  return (
    <div className={quizCompletionContainer()}>
      <div className="quiz-container-card p-6">
        <div className="flex justify-end mb-3">
          <span className="text-xs text-gray-500 font-medium tabular-nums">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>

        <QuizProgressBar />

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
            <h2 className="text-[24px] font-semibold text-white leading-snug tracking-tight">
              <QuizClozeQuestion
                question={currentQuestion?.question ?? ''}
                type={currentQuestion?.type}
              />
            </h2>
          </div>

          <QuizMCQGrid highlightedIdx={highlightedIdx} />
          <QuizClozeInput />
        </div>

        <QuizExplanation />
        <QuizBottomNav />
      </div>
    </div>
  );
}
