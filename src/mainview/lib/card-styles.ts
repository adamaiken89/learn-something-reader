import { cva } from 'class-variance-authority';

export const selectableCardVariants = cva('p-3 rounded-xl border-2 transition-all', {
  variants: {
    selected: {
      true: 'border-indigo-500 bg-indigo-900/30',
      false: 'border-gray-700 bg-gray-800/50 hover:border-gray-500',
    },
  },
  defaultVariants: {
    selected: false,
  },
});

export const selectableItemVariants = cva('transition-colors', {
  variants: {
    selected: {
      true: 'bg-indigo-600/20 text-indigo-300',
      false: 'text-gray-300 hover:bg-gray-700',
    },
  },
  defaultVariants: {
    selected: false,
  },
});
