import { BookOpen, CheckCircle2, Layers, LayoutGrid, Play, RotateCcw, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/shadcn/button';

import type { CourseQuizStatus, CourseStats } from '../../bun/stats';
import type { Course, QuizIndex } from '../../bun/types';
import { api } from '../api';
import CourseSwitcher from '../components/CourseSwitcher';
import CourseTags from '../components/dashboard/CourseTags';
import ProgressBar from '../components/dashboard/ProgressBar';
import ModuleRow from '../components/syllabus/ModuleRow';
import PageContent from '../layouts/PageContent';
import PageHeader from '../layouts/PageHeader';
import PageLayout from '../layouts/PageLayout';
import { countCompleted, useCompletionStore } from '../stores/completionStore';
import { useViewStore } from '../stores/viewStore';

interface SyllabusPageProps {
  course: Course;
  onBack: () => void;
}

function formatDomain(domain: string): string {
  return domain
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function SyllabusPage({ course, onBack }: SyllabusPageProps) {
  const { t } = useTranslation();
  const push = useViewStore((s) => s.push);
  const completed = useCompletionStore((s) => s.completed);
  const totalModules = useCompletionStore((s) => s.totalModules);
  const total = totalModules[course.id] ?? course.modules.length;
  const done = countCompleted(completed, course.id);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isComplete = total > 0 && done === total;
  const hasProgress = done > 0;
  const [quizIndex, setQuizIndex] = useState<QuizIndex | null>(null);
  const [quizStatus, setQuizStatus] = useState<CourseQuizStatus | null>(null);
  const [courseStats, setCourseStats] = useState<CourseStats | null>(null);
  const [hasCumulative, setHasCumulative] = useState(false);
  useEffect(() => {
    api.quiz
      .index(course.id)
      .then((i) => {
        setQuizIndex(i);
        setHasCumulative(i.cumulativeQuizzes.length > 0);
      })
      .catch(() => {});
    api.quiz
      .status(course.id)
      .then(setQuizStatus)
      .catch(() => {});
    api.stats
      .course(course.id)
      .then(setCourseStats)
      .catch(() => {});
  }, [course.id]);

  const handleStart = () => {
    const firstIncomplete = course.modules.find((m) => !completed[`${course.id}:${m.id}`]);
    if (firstIncomplete) {
      push({ type: 'lesson', course, module: firstIncomplete });
    } else {
      push({ type: 'lesson', course, module: course.modules[0] });
    }
  };

  const handleResume = () => {
    void api.session.getCourseModuleSessions(course.id).then((sessions) => {
      if (sessions.length > 0) {
        const last = sessions[0];
        const mod = course.modules.find((m) => m.id === last.moduleId);
        if (mod) {
          push({ type: 'lesson', course, module: mod, sectionID: last.sectionId || undefined });
          return;
        }
      }
      handleStart();
    });
  };

  const handleModuleClick = (mod: Course['modules'][number]) => {
    push({ type: 'lesson', course, module: mod });
  };

  const practiceTagClass = 'px-2 py-1 text-[10px] rounded-md font-medium cursor-pointer';
  const inactivePracticeClass = 'bg-gray-700/30 text-gray-300 hover:bg-gray-600/50';
  const quizModuleIds = new Set(
    Object.keys(quizIndex?.modules ?? {}).map((dir) => dir.split('-')[0]),
  );

  const quickActions = (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-gray-500 uppercase tracking-wider mr-0.5">
        {t('lesson.practice', 'Practice')}
      </span>
      {hasCumulative && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            push({ type: 'cumulativeQuiz', course });
          }}
          className={`${practiceTagClass} ${inactivePracticeClass}`}
        >
          <Layers size={11} className="inline mr-1" />
          {t('lesson.quizCumulative', 'Cumulative')}
        </button>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          push({ type: 'quizHub', course });
        }}
        className={`${practiceTagClass} ${inactivePracticeClass}`}
      >
        <LayoutGrid size={11} className="inline mr-1" />
        {t('quiz.allQuizzes')}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          push({ type: 'review', course });
        }}
        className={`${practiceTagClass} ${inactivePracticeClass}`}
      >
        <RotateCcw size={11} className="inline mr-1" />
        {t('common.review', 'Review')}
      </button>
    </div>
  );

  const ctaButtons = (
    <div className="flex items-center flex-wrap justify-between gap-3 mt-5">
      <div className="flex items-center gap-3">
        {isComplete ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium">
            <CheckCircle2 size={16} />
            {t('syllabus.complete', 'Course Complete')}
          </span>
        ) : (
          <>
            <Button onClick={handleStart} variant="primary" className="font-sans gap-1.5">
              <Play size={14} />
              {t('syllabus.continue', 'Continue')}
            </Button>
            {hasProgress && (
              <Button onClick={handleResume} variant="outline" className="font-sans gap-1.5">
                <BookOpen size={14} />
                {t('syllabus.resume', 'Resume')}
              </Button>
            )}
          </>
        )}
      </div>
      {quickActions}
    </div>
  );

  return (
    <PageLayout>
      <PageHeader onBack={onBack}>
        <CourseSwitcher
          currentCourseId={course.id}
          onSelect={(c) => push({ type: 'syllabus', course: c })}
        />
      </PageHeader>
      <PageContent className="px-6">
        <div className="py-8 space-y-8">
          {/* Hero */}
          <div className="anim-fade-in-up bg-gray-800/40 border border-gray-700/50 rounded-xl p-6">
            <h1 className="text-2xl font-bold text-white mb-2">{course.displayName}</h1>
            <CourseTags
              targetLevel={course.targetLevel}
              timeHours={course.timeBudgetHours}
              moduleCount={course.modules.length}
            />
            {course.domain && (
              <div className="mt-1.5 text-xs text-gray-400">{formatDomain(course.domain)}</div>
            )}
            {total > 0 && <ProgressBar pct={pct} />}
            {ctaButtons}
          </div>

          {/* Prerequisites */}
          {course.prerequisites.length > 0 && (
            <section className="anim-fade-in-up" style={{ animationDelay: '60ms' }}>
              <h2 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                <Target size={14} className="text-indigo-400" />
                {t('syllabus.prerequisites', 'Prerequisites')}
              </h2>
              <div className="flex flex-wrap gap-2">
                {course.prerequisites.map((p, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-xs rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Learning Objectives */}
          {course.learningObjectives.length > 0 && (
            <section className="anim-fade-in-up" style={{ animationDelay: '120ms' }}>
              <h2 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                <Target size={14} className="text-indigo-400" />
                {t('syllabus.learningObjectives', 'Learning Objectives')}
              </h2>
              <ul className="space-y-2">
                {course.learningObjectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                    <CheckCircle2 size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Module List */}
          <section className="anim-fade-in-up" style={{ animationDelay: '180ms' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <BookOpen size={14} className="text-indigo-400" />
                {t('syllabus.modules', 'Modules')} ({course.modules.length})
              </h2>
              {total > 0 && (
                <span className="text-xs text-gray-500">
                  {done}/{total}
                </span>
              )}
            </div>

            <div className="space-y-1">
              {course.modules.map((mod, idx) => {
                const modKey = `${course.id}:${mod.id}`;
                return (
                  <ModuleRow
                    key={mod.id}
                    mod={mod}
                    index={idx}
                    courseModules={course.modules}
                    isCompleted={!!completed[modKey]}
                    hasQuiz={quizModuleIds.has(mod.id)}
                    attempt={
                      quizStatus?.modules.find((m) => m.moduleId === mod.id)?.attempt ?? null
                    }
                    srsDueCount={courseStats?.moduleSrsDue[mod.id] ?? 0}
                    onOpen={handleModuleClick}
                    onOpenQuiz={(m) => push({ type: 'quiz', course, module: m })}
                  />
                );
              })}
            </div>
          </section>

          <div className="h-16" />
        </div>
      </PageContent>
    </PageLayout>
  );
}
