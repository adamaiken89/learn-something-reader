import { cva } from 'class-variance-authority';

const TOGGLE_ACTIVE_CLASSES = 'bg-indigo-600 text-white';

export const toggleVariants = cva('px-2 py-0.5 text-xs rounded transition-colors', {
  variants: {
    active: {
      true: TOGGLE_ACTIVE_CLASSES,
      false: 'bg-gray-700 hover:bg-gray-600',
    },
  },
  defaultVariants: {
    active: false,
  },
});
