import { create } from 'zustand';

import type { QuizQuestion } from '../../bun/types';

export type QuizStatus = 'loading' | 'ready' | 'completed';

interface QuizState {
  status: QuizStatus;
  questions: QuizQuestion[];
  currentIndex: number;
  selectedAnswers: Record<string, string>;
  textInput: string;
  highlightedIdx: number;

  // Derived (via selectors)
  currentQuestion: QuizQuestion | undefined;
  hasAnswer: boolean;
  score: number;

  // Actions
  setQuestions: (qs: QuizQuestion[]) => void;
  loadFailed: () => void;
  selectAnswer: (key: string) => void;
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
};

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
      currentQuestion: qs[0],
      hasAnswer: false,
      score: 0,
    });
  },

  loadFailed: () => {
    set({ ...INITIAL, status: 'ready', currentQuestion: undefined, hasAnswer: false, score: 0 });
  },

  selectAnswer: (answer) => {
    const state = get();
    const q = state.questions[state.currentIndex];
    if (!q) return;
    const selectedAnswers = { ...state.selectedAnswers, [q.id]: answer };
    const score = state.questions.filter((q) => selectedAnswers[q.id] === q.answer).length;
    set({
      selectedAnswers,
      textInput: q.type === 'cloze' ? answer : state.textInput,
      hasAnswer: true,
      score,
    });
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
