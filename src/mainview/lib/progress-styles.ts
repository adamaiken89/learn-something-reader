import { cva } from 'class-variance-authority';

export const progressBarVariants = cva('bg-gray-700 rounded overflow-hidden', {
  variants: {
    size: {
      sm: 'h-1.5',
      md: 'h-2',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});
