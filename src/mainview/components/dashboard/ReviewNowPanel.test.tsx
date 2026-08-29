import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'bun:test';

import type { GlobalStats } from '../../../bun/stats';
import type { Course } from '../../../bun/types';
import type { DueQuiz } from '../../hooks/useQuizDueStatus';
import { useViewStore } from '../../stores/viewStore';
import ReviewNowPanel from './ReviewNowPanel';

const mkCourse = (id: string, displayName: string): Course =>
  ({
    id,
    course: id,
    displayName,
    modules: [],
    timeBudgetHours: 1,
    targetLevel: 'beginner',
    domain: id,
    prerequisites: [],
    learningObjectives: [],
  }) as Course;

const mkStats = (rows: { id: string; srs: number }[]): GlobalStats =>
  ({
    totalCourses: rows.length,
    totalModules: 0,
    totalCompletedModules: 0,
    totalStudyMinutes: 0,
    streak: 0,
    totalSrsDueCount: rows.reduce((a, r) => a + r.srs, 0),
    courseSummaries: rows.map((r) => ({
      courseID: r.id,
      courseName: r.id,
      completed: 0,
      total: 0,
      lastStudied: null,
      srsDueCount: r.srs,
      srsTotalCards: 0,
    })),
  }) as GlobalStats;

const mkDue = (course: Course, label: string): DueQuiz =>
  ({ course, view: { type: 'quizHub', course }, kind: 'module', label }) as DueQuiz;

beforeEach(() => {
  useViewStore.setState({ views: [] });
});

describe('ReviewNowPanel', () => {
  test('renders null when loading', () => {
    const { container } = render(
      <ReviewNowPanel courses={[]} globalStats={null} ready={[]} overdue={[]} loading={true} />,
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders null when no due items', () => {
    const { container } = render(
      <ReviewNowPanel
        courses={[]}
        globalStats={mkStats([])}
        ready={[]}
        overdue={[]}
        loading={false}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders srs due row', () => {
    const course = mkCourse('m', 'Math');
    const { getByText } = render(
      <ReviewNowPanel
        courses={[course]}
        globalStats={mkStats([{ id: 'm', srs: 3 }])}
        ready={[]}
        overdue={[]}
        loading={false}
      />,
    );
    expect(getByText('Math')).toBeInTheDocument();
  });

  test('row click with quiz due pushes quizHub', async () => {
    const user = userEvent.setup();
    const course = mkCourse('m', 'Math');
    const ready = [mkDue(course, 'Q1')];
    const { getByText } = render(
      <ReviewNowPanel
        courses={[course]}
        globalStats={mkStats([])}
        ready={ready}
        overdue={[]}
        loading={false}
      />,
    );
    await user.click(getByText('Math'));
    const views = useViewStore.getState().views;
    expect(views[0].type).toBe('quizHub');
  });

  test('row click with srs only pushes review', async () => {
    const user = userEvent.setup();
    const course = mkCourse('m', 'Math');
    const { getByText } = render(
      <ReviewNowPanel
        courses={[course]}
        globalStats={mkStats([{ id: 'm', srs: 2 }])}
        ready={[]}
        overdue={[]}
        loading={false}
      />,
    );
    await user.click(getByText('Math'));
    const views = useViewStore.getState().views;
    expect(views[0].type).toBe('review');
  });

  test('row click with overdue pushes quizHub', async () => {
    const user = userEvent.setup();
    const course = mkCourse('m', 'Math');
    const overdue = [mkDue(course, 'Q1')];
    const { getByText } = render(
      <ReviewNowPanel
        courses={[course]}
        globalStats={mkStats([])}
        ready={[]}
        overdue={overdue}
        loading={false}
      />,
    );
    await user.click(getByText('Math'));
    const views = useViewStore.getState().views;
    expect(views[0].type).toBe('quizHub');
  });

  test('shows more button when rows > ROW_LIMIT', () => {
    const courses = Array.from({ length: 6 }, (_, i) => mkCourse(`c${i}`, `C${i}`));
    const stats = mkStats(courses.map((c) => ({ id: c.id, srs: 1 })));
    const { getByText } = render(
      <ReviewNowPanel
        courses={courses}
        globalStats={stats}
        ready={[]}
        overdue={[]}
        loading={false}
      />,
    );
    expect(getByText(/\+\d+ more/i)).toBeInTheDocument();
  });

  test('expands on show all click', async () => {
    const user = userEvent.setup();
    const courses = Array.from({ length: 6 }, (_, i) => mkCourse(`c${i}`, `C${i}`));
    const stats = mkStats(courses.map((c) => ({ id: c.id, srs: 1 })));
    const { getByText } = render(
      <ReviewNowPanel
        courses={courses}
        globalStats={stats}
        ready={[]}
        overdue={[]}
        loading={false}
      />,
    );
    await user.click(getByText(/\+\d+ more/i));
    expect(getByText('Show less')).toBeInTheDocument();
  });

  test('sort: quizOverdue first, then quizReady, then srs desc', () => {
    const c1 = mkCourse('c1', 'Course1');
    const c2 = mkCourse('c2', 'Course2');
    const c3 = mkCourse('c3', 'Course3');
    const ready = [mkDue(c2, 'Q')];
    const overdue = [mkDue(c1, 'Q')];
    const stats = mkStats([
      { id: 'c1', srs: 1 },
      { id: 'c2', srs: 5 },
      { id: 'c3', srs: 3 },
    ]);
    const { container } = render(
      <ReviewNowPanel
        courses={[c1, c2, c3]}
        globalStats={stats}
        ready={ready}
        overdue={overdue}
        loading={false}
      />,
    );
    const buttons = container.querySelectorAll('button');
    expect(buttons[0].textContent).toContain('Course1');
    expect(buttons[1].textContent).toContain('Course2');
    expect(buttons[2].textContent).toContain('Course3');
  });
});
