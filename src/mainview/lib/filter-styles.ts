import { cva } from 'class-variance-authority';

export const filterVariants = cva('px-3 py-1 text-xs rounded transition-colors', {
  variants: {
    active: {
      true: 'bg-indigo-600 text-white',
      false: 'bg-gray-700 hover:bg-gray-600',
    },
  },
  defaultVariants: {
    active: false,
  },
});
