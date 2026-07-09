import { cva } from 'class-variance-authority';

const progressBarVariants = cva('bg-gray-700 rounded-full overflow-hidden', {
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

export default function ProgressBar({ pct, size = 'md' }: { pct: number; size?: 'sm' | 'md' }) {
  return (
    <div className="mt-3">
      <div className={progressBarVariants({ size })}>
        <div
          className="h-full bg-indigo-500 transition-all"
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
    </div>
  );
}
