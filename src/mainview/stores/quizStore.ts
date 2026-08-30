import { create } from 'zustand';

import type { QuizQuestion } from '../../bun/types';
import { clozeCorrect, questionPoints, totalPointsFor } from '../quizUtil';

type QuizStatus = 'loading' | 'ready' | 'completed';

interface QuizState {
  status: QuizStatus;
  questions: QuizQuestion[];
  currentIndex: number;
  selectedAnswers: Record<string, string>;
  textInput: string;
  highlightedIdx: number;
  /** Number of submitted attempts per cloze question. Max 2: a wrong 1st attempt allows one retry, then reveal + fixed score. */
  clozeAttempts: Record<string, number>;
  /** Per-blank input values for the current cloze question (index = blank position). */
  clozeBlankInputs: string[];
  /** Achievable points: one per cloze blank, one per mcq/tf. */
  totalPoints: number;

  // Derived (via selectors)
  currentQuestion: QuizQuestion | undefined;
  hasAnswer: boolean;
  /** Points earned (partial credit: cloze blanks count individually). */
  score: number;

  // Actions
  setQuestions: (qs: QuizQuestion[]) => void;
  loadFailed: () => void;
  selectAnswer: (key: string) => void;
  setClozeBlankInput: (index: number, value: string) => void;
  submitCloze: () => void;
  nextQuestion: () => void;
  skipQuestion: () => void;
  retry: () => void;
  setTextInput: (v: string) => void;
  setHighlightedIdx: (i: number | ((prev: number) => number)) => void;
  reset: () => void;
}

const INITIAL = {
  status: 'loading' as QuizStatus,
  questions: [],
  currentIndex: 0,
  selectedAnswers: {},
  textInput: '',
  highlightedIdx: -1,
  clozeAttempts: {},
  clozeBlankInputs: [] as string[],
  totalPoints: 0,
};

function isCorrect(q: QuizQuestion, ua: string | undefined): boolean {
  if (ua === undefined) return false;
  return q.type === 'cloze' ? clozeCorrect(q, ua) : ua === q.answer;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  ...INITIAL,

  currentQuestion: undefined,
  hasAnswer: false,
  score: 0,

  setQuestions: (qs) => {
    set({
      status: 'ready',
      questions: qs,
      currentIndex: 0,
      selectedAnswers: {},
      textInput: '',
      highlightedIdx: -1,
      clozeAttempts: {},
      clozeBlankInputs: [],
      totalPoints: totalPointsFor(qs),
      currentQuestion: qs[0],
      hasAnswer: false,
      score: 0,
    });
  },

  loadFailed: () => {
    set({
      ...INITIAL,
      status: 'ready',
      currentQuestion: undefined,
      hasAnswer: false,
      score: 0,
    });
  },

  selectAnswer: (answer) => {
    const state = get();
    const q = state.questions[state.currentIndex];
    if (!q) return;
    const scoreFor = (selected: Record<string, string>) =>
      state.questions.reduce((sum, qq) => sum + questionPoints(qq, selected[qq.id]), 0);

    if (q.type === 'cloze') {
      const attempt = (state.clozeAttempts[q.id] ?? 0) + 1;
      const clozeAttempts = { ...state.clozeAttempts, [q.id]: attempt };
      const correct = isCorrect(q, answer);
      if (correct || attempt >= 2) {
        // 1st attempt correct, or 2nd attempt: resolve (reveal + fixed score).
        const selectedAnswers = { ...state.selectedAnswers, [q.id]: answer };
        set({
          selectedAnswers,
          clozeAttempts,
          textInput: answer,
          hasAnswer: true,
          score: scoreFor(selectedAnswers),
        });
      } else {
        // 1st attempt wrong: warn, keep editable, nothing scored yet.
        set({ clozeAttempts, textInput: answer, hasAnswer: false });
      }
      return;
    }

    const selectedAnswers = { ...state.selectedAnswers, [q.id]: answer };
    set({
      selectedAnswers,
      textInput: state.textInput,
      hasAnswer: true,
      score: scoreFor(selectedAnswers),
    });
  },

  setClozeBlankInput: (index, value) => {
    const inputs = [...get().clozeBlankInputs];
    while (inputs.length <= index) inputs.push('');
    inputs[index] = value;
    set({ clozeBlankInputs: inputs });
  },

  submitCloze: () => {
    const state = get();
    const q = state.questions[state.currentIndex];
    if (!q || q.type !== 'cloze') return;
    if (state.clozeBlankInputs.length === 0) return;
    if (state.clozeBlankInputs.some((v) => !v.trim())) return;
    state.selectAnswer(state.clozeBlankInputs.map((v) => v.trim()).join(', '));
  },

  nextQuestion: () => {
    const state = get();
    if (state.currentIndex < state.questions.length - 1) {
      const nextIdx = state.currentIndex + 1;
      set({
        currentIndex: nextIdx,
        currentQuestion: state.questions[nextIdx],
        hasAnswer: state.selectedAnswers[state.questions[nextIdx].id] !== undefined,
        textInput: '',
        highlightedIdx: -1,
        clozeBlankInputs: [],
      });
    } else {
      set({ status: 'completed' });
    }
  },

  skipQuestion: () => {
    const state = get();
    if (state.currentIndex < state.questions.length - 1) {
      const nextIdx = state.currentIndex + 1;
      set({
        currentIndex: nextIdx,
        currentQuestion: state.questions[nextIdx],
        hasAnswer: state.selectedAnswers[state.questions[nextIdx].id] !== undefined,
        textInput: '',
        highlightedIdx: -1,
        clozeBlankInputs: [],
      });
    } else {
      set({ status: 'completed' });
    }
  },

  retry: () => {
    set({
      status: 'ready',
      currentIndex: 0,
      selectedAnswers: {},
      textInput: '',
      highlightedIdx: -1,
      clozeAttempts: {},
      clozeBlankInputs: [],
      totalPoints: totalPointsFor(get().questions),
      currentQuestion: get().questions[0],
      hasAnswer: false,
      score: 0,
    });
  },

  setTextInput: (v) => set({ textInput: v }),

  setHighlightedIdx: (i) => {
    if (typeof i === 'function') {
      set((state) => ({ highlightedIdx: i(state.highlightedIdx) }));
    } else {
      set({ highlightedIdx: i });
    }
  },

  reset: () => {
    set({
      ...INITIAL,
      currentQuestion: undefined,
      hasAnswer: false,
      score: 0,
    });
  },
}));
