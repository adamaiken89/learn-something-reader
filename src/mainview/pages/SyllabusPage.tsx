import {
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
  LayoutGrid,
  ListChecks,
  Play,
  RotateCcw,
  Target,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { CourseQuizStatus, CourseStats } from '../../bun/stats';
import type { Course, QuizIndex } from '../../bun/types';
import { api } from '../api';
import CourseSwitcher from '../components/CourseSwitcher';
import CourseTags from '../components/dashboard/CourseTags';
import ProgressBar from '../components/dashboard/ProgressBar';
import { Button } from '../components/ui/Button';
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
                const isCompleted = !!completed[modKey];
                const hasQuiz = quizModuleIds.has(mod.id);
                const attempt = quizStatus?.modules.find((m) => m.moduleId === mod.id)?.attempt;
                const quizDue = attempt?.due ?? false;
                const quizOverdue = attempt?.overdue ?? false;
                const srsDue = courseStats?.moduleSrsDue[mod.id] ?? 0;
                const showDue = quizDue || srsDue > 0;
                return (
                  <div
                    key={mod.id}
                    onClick={() => handleModuleClick(mod)}
                    data-testid="module-row"
                    className="group flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-700/50 hover:border-indigo-500/30 bg-gray-800/30 hover:bg-gray-800/60 transition-all duration-150 cursor-pointer"
                  >
                    <span
                      className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-gray-700/50 text-gray-400 border border-gray-600/50'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 size={14} /> : <span>{idx + 1}</span>}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-medium text-gray-200 group-hover:text-indigo-400 transition-colors truncate"
                          data-testid="module-name"
                        >
                          {mod.name}
                        </span>
                        {mod.timeHours > 0 && (
                          <span className="shrink-0 text-[11px] text-gray-400 flex items-center gap-0.5">
                            <Clock size={11} />
                            {mod.timeHours}h
                          </span>
                        )}
                      </div>
                      {mod.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {mod.topics.slice(0, 5).map((topic) => (
                            <span
                              key={topic}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/40 text-gray-400"
                            >
                              {topic}
                            </span>
                          ))}
                          {mod.topics.length > 5 && (
                            <span className="text-[10px] text-gray-600">
                              +{mod.topics.length - 5}
                            </span>
                          )}
                        </div>
                      )}
                      {mod.prerequisites.length > 0 && (
                        <div className="mt-0.5 text-[10px] text-gray-600">
                          {t('syllabus.prereqOf', 'Prereq:')}{' '}
                          {mod.prerequisites
                            .map((p) => course.modules.find((m) => m.id === p)?.name || p)
                            .join(', ')}
                        </div>
                      )}
                    </div>
                    {showDue && (
                      <span className="flex items-center gap-1.5 shrink-0">
                        {quizDue && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                              quizOverdue
                                ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                            }`}
                          >
                            {quizOverdue ? t('syllabus.quizOverdue') : t('syllabus.quizReady')}
                          </span>
                        )}
                        {srsDue > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            {t('syllabus.srsDue', { count: srsDue })}
                          </span>
                        )}
                      </span>
                    )}
                    {hasQuiz && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          push({ type: 'quiz', course, module: mod });
                        }}
                        title={t('quiz.allQuizzes')}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 border border-indigo-500/20 hover:border-indigo-500/40 transition-colors"
                      >
                        <ListChecks size={13} />
                        {t('lesson.quizMCQ', 'MCQ')}
                      </button>
                    )}
                  </div>
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
