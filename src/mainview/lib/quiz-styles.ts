import { cva } from 'class-variance-authority';
import clsx from 'clsx';

export const quizCompletionContainer = cva(
  'w-full max-w-4xl mx-auto px-4 flex-1 flex flex-col justify-center',
);

export const quizNavButton = cva(
  'px-3 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors',
);

export const quizCtaButton = cva(
  'px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
);

interface OptionState {
  showCorrect?: boolean;
  showWrong?: boolean;
  isSelected?: boolean;
  isHighlighted?: boolean;
  hasAnswer?: boolean;
}

export function optionButtonClass(st: OptionState) {
  return clsx(
    'group w-full text-left px-4 py-3.5 rounded-[10px] border-2 transition-all duration-200 flex items-center gap-4',
    'text-[15px] font-medium',
    st.showCorrect
      ? 'bg-emerald-500/8 border-emerald-500/30 text-emerald-100'
      : st.showWrong
        ? 'bg-red-500/8 border-red-500/30 text-red-100 animate-[shake_0.3s_ease-in-out]'
        : st.isSelected
          ? 'bg-indigo-500/10 border-indigo-400/40 text-indigo-100'
          : st.isHighlighted
            ? 'bg-indigo-500/15 border-indigo-400/70 text-indigo-100 ring-2 ring-indigo-400/50 hover:bg-indigo-500/20'
            : 'bg-gray-800/50 border-gray-600/40 text-gray-200 hover:border-gray-400 hover:bg-gray-700/40',
    !st.hasAnswer ? 'cursor-pointer' : 'cursor-default',
  );
}

export function radioIndicatorClass(st: OptionState) {
  return clsx(
    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold transition-all',
    st.showCorrect
      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
      : st.showWrong
        ? 'border-red-400 bg-red-500/20 text-red-300'
        : st.isSelected
          ? 'border-indigo-400 bg-indigo-500/20 text-indigo-300'
          : st.isHighlighted
            ? 'border-indigo-400'
            : 'border-gray-500 group-hover:border-indigo-300 group-hover:bg-indigo-500/10',
  );
}

export function progressSegmentClass(isPast: boolean, isCurrent: boolean) {
  return clsx(
    'h-1.5 flex-1 rounded-full transition-all duration-300',
    isPast ? 'bg-indigo-500' : isCurrent ? 'bg-indigo-400 progress-pill-active' : 'bg-gray-700',
  );
}
