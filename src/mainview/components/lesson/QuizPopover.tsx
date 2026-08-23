import { CheckSquare, Layers } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '../../api';
import { useCurrentLesson } from '../../hooks/useCurrentLesson';
import { useViewStore } from '../../stores/viewStore';

export default function QuizPopover() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const { course, module } = useCurrentLesson();
  const push = useViewStore((s) => s.push);
  const [hasCumulative, setHasCumulative] = useState(false);

  useEffect(() => {
    if (course) {
      api.quiz
        .hasCumulative(course.id)
        .then(setHasCumulative)
        .catch(() => {});
    }
  }, [course]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const getDropdownLeft = () => {
    if (!btnRef.current || !ref.current) return 0;
    const btnRect = btnRef.current.getBoundingClientRect();
    const wrapperRect = ref.current.getBoundingClientRect();
    return btnRect.left - wrapperRect.left;
  };

  const handleQuiz = (type: 'quiz' | 'cumulativeQuiz') => {
    if (!course || !module) return;
    setOpen(false);
    if (type === 'cumulativeQuiz') {
      push({ type, course });
    } else {
      push({ type, course, module });
    }
  };

  const btnClass =
    'flex items-center gap-2 w-full px-2.5 py-1.5 text-[11px] text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded transition-colors';

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className={`px-2 py-1 text-[11px] rounded transition-colors ${
          open ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
        }`}
        title={t('common.quiz')}
        data-testid="quiz-popover-trigger"
      >
        {t('common.quiz')}
      </button>
      {open && (
        <div
          className="absolute top-full mt-2 z-40 bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-2xl py-1 min-w-[120px]"
          style={{ left: getDropdownLeft() }}
        >
          <div className="absolute -top-1.5 left-4 w-3 h-3 bg-gray-900/95 border-l border-t border-gray-700/50 rotate-45" />
          <button onClick={() => handleQuiz('quiz')} className={btnClass} data-testid="quiz-start-mcq">
            <CheckSquare className="w-3.5 h-3.5" />
            {t('lesson.quizMCQ', 'Quiz')}
          </button>
          {hasCumulative && (
            <button onClick={() => handleQuiz('cumulativeQuiz')} className={btnClass}>
              <Layers className="w-3.5 h-3.5" />
              {t('lesson.quizCumulative', 'Cumulative')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
