import { useEffect, useRef } from 'react';

import type { QuizQuestion } from '../../bun/types';
import { api } from '../api';
import { logger } from '../logger';
import {
  normalizeClozeBlanks,
  questionPoints,
  shuffleQuestions,
  totalPointsFor,
} from '../quizUtil';
import { useQuizStore } from '../stores/quizStore';
import { showToast } from '../toast';

type QuizLoader = (courseId: string, moduleId: string) => Promise<QuizQuestion[]>;

export function useQuizEngine(courseId: string, moduleId: string, loader?: QuizLoader) {
  const setQuestions = useQuizStore((s) => s.setQuestions);
  const loadFailed = useQuizStore((s) => s.loadFailed);
  const reset = useQuizStore((s) => s.reset);
  const status = useQuizStore((s) => s.status);
  const questions = useQuizStore((s) => s.questions);
  const selectedAnswers = useQuizStore((s) => s.selectedAnswers);

  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    reset();
    const loadFn = loaderRef.current ?? api.quiz.start;
    loadFn(courseId, moduleId)
      .then((qs) => {
        setQuestions(normalizeClozeBlanks(shuffleQuestions(qs)));
      })
      .catch((err) => {
        logger.warn({ err }, 'Quiz load failed');
        showToast.error('toast.loadFailed');
        loadFailed();
      });
  }, [courseId, moduleId, reset, setQuestions, loadFailed]);

  useEffect(() => {
    if (status === 'completed' && questions.length > 0) {
      const scoreVal = questions.reduce(
        (sum, q) => sum + questionPoints(q, selectedAnswers[q.id]),
        0,
      );
      api.stats
        .logSession({
          courseID: courseId,
          moduleID: moduleId,
          durationMinutes: Math.ceil(questions.length * 1.5),
          type: 'quiz',
          score: scoreVal,
          total: totalPointsFor(questions),
        })
        .catch((err) => {
          logger.warn({ err }, 'Failed to log quiz session');
        });
    }
  }, [status, courseId, moduleId, questions, selectedAnswers]);
}
