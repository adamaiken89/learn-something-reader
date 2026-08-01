import { Layers, ListChecks, Play, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { CourseQuizStatus, QuizAttemptStatus } from '../../bun/stats';
import type { Course, QuizIndex } from '../../bun/types';
import { api } from '../api';
import QuizHeader from '../components/QuizHeader';
import { Button } from '../components/ui/Button';
import { loadingIndicator } from '../components/ui/variants/loading';
import PageContent from '../layouts/PageContent';
import PageLayout from '../layouts/PageLayout';
import { useViewStore } from '../stores/viewStore';

interface Props {
  course: Course;
  onBack: () => void;
}

function AttemptBadge({ attempt }: { attempt: QuizAttemptStatus | null }) {
  const { t } = useTranslation();
  if (!attempt) {
    return <span className="text-xs text-gray-600">—</span>;
  }
  if (!attempt.attempted) {
    return attempt.due ? (
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
        {t('quizHub.due')}
      </span>
    ) : (
      <span className="text-xs text-gray-600">—</span>
    );
  }
  const pct = attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0;
  const passed = pct >= 80;
  return (
    <span className="flex items-center gap-1.5">
      <span className={`text-xs font-medium ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>
        {passed ? '✓ ' : ''}
        {pct}%
      </span>
      {attempt.due && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
          {t('quizHub.due')}
        </span>
      )}
    </span>
  );
}

export default function QuizHubPage({ course, onBack }: Props) {
  const { t } = useTranslation();
  const push = useViewStore((s) => s.push);
  const [status, setStatus] = useState<CourseQuizStatus | null>(null);
  const [index, setIndex] = useState<QuizIndex | null>(null);

  useEffect(() => {
    void api.quiz
      .status(course.id)
      .then(setStatus)
      .catch(() => {});
    void api.quiz
      .index(course.id)
      .then(setIndex)
      .catch(() => {});
  }, [course.id]);

  if (!status || !index) {
    return (
      <PageLayout>
        <QuizHeader onBack={onBack} currentCourseId={course.id} title={t('quizHub.title')} />
        <PageContent className="px-6">{loadingIndicator()}</PageContent>
      </PageLayout>
    );
  }

  const rowClass =
    'w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-700/50 hover:border-indigo-500/30 bg-gray-800/30 hover:bg-gray-800/60 transition-all duration-150 text-left cursor-pointer';

  return (
    <PageLayout>
      <QuizHeader onBack={onBack} currentCourseId={course.id} title={t('quizHub.title')} />
      <PageContent className="px-6">
        <div className="py-8 space-y-8 max-w-3xl">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{course.displayName}</h1>
            <p className="text-sm text-gray-400">{t('quizHub.subtitle')}</p>
          </div>

          {index.cumulativeQuizzes.length > 0 && (
            <Button
              onClick={() =>
                push({
                  type: 'cumulativeQuiz',
                  course,
                  cumulativeQuizId: index.cumulativeQuizzes[0]?.id,
                })
              }
              variant="primary"
              className="font-sans gap-1.5"
            >
              <Play size={14} />
              {t('quizHub.startReview')}
            </Button>
          )}

          {/* Module quizzes */}
          <section>
            <h2 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <ListChecks size={14} className="text-indigo-400" />
              {t('quizHub.moduleQuizzes')}
            </h2>
            <div className="space-y-2">
              {status.modules.map((mod, idx) => {
                const module = course.modules.find((m) => m.id === mod.moduleId);
                return (
                  <button
                    key={mod.moduleId}
                    onClick={() => module && push({ type: 'quiz', course, module })}
                    className={rowClass}
                  >
                    <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-gray-700/50 text-gray-400 border border-gray-600/50">
                      {idx + 1}
                    </span>
                    <span className="flex-1 truncate">
                      <span className="block text-sm font-medium text-gray-200 truncate">
                        {mod.moduleName}
                      </span>
                      <span className="block text-xs text-gray-400">
                        {t('lesson.quizMCQ', 'MCQ')} · {t('lesson.quizCloze', 'Cloze')}
                      </span>
                    </span>
                    <AttemptBadge attempt={mod.attempt} />
                  </button>
                );
              })}
            </div>
          </section>

          {/* Cumulative quizzes */}
          {status.cumulativeQuizzes.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                <Layers size={14} className="text-indigo-400" />
                {t('quizHub.cumulativeReviews')}
              </h2>
              <div className="space-y-2">
                {status.cumulativeQuizzes.map((cq) => (
                  <button
                    key={cq.id}
                    onClick={() =>
                      push({ type: 'cumulativeQuiz', course, cumulativeQuizId: cq.id })
                    }
                    className={rowClass}
                  >
                    <Layers size={14} className="text-indigo-400 shrink-0" />
                    <span className="flex-1 text-sm text-gray-300">
                      {t('lesson.cumulativeQuiz', 'Cumulative Review')}
                      {cq.displayLabel}
                    </span>
                    <AttemptBadge attempt={cq.attempt} />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Review SRS */}
          <Button
            onClick={() => push({ type: 'review', course })}
            variant="outline"
            className="font-sans gap-1.5"
          >
            <RotateCcw size={14} />
            {t('common.review')}
          </Button>
        </div>
      </PageContent>
    </PageLayout>
  );
}
