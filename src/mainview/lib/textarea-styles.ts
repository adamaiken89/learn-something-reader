import { cva } from 'class-variance-authority';

export const textareaVariants = cva(
  'w-full border border-gray-600 rounded text-xs p-2 text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500',
  {
    variants: {
      bg: {
        '700': 'bg-gray-700',
        '800': 'bg-gray-800',
      },
      height: {
        sm: 'h-16',
        md: 'h-20',
      },
    },
    defaultVariants: {
      bg: '700',
      height: 'sm',
    },
  },
);
