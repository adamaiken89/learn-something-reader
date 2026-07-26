import { progressBarVariants } from '../ui/variants/progress';

export default function ProgressBar({ pct, size = 'md' }: { pct: number; size?: 'sm' | 'md' }) {
  return (
    <div className="mt-3">
      <div className={progressBarVariants({ size })}>
        <div
          className="h-full bg-indigo-500 transition-all group-hover:drop-shadow-[0_0_3px_rgba(99,102,241,0.4)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
