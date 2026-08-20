import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, spyOn, test } from 'bun:test';

import i18n from '../i18n';
import { useCompletionStore } from '../stores/completionStore';
import { useCourseStore } from '../stores/courseStore';
import { useSettingsStore } from '../stores/settingsStore';
import { clearMocks, mockResponse, setupRPC } from '../testUtils';

setupRPC();

import DashboardPage from './DashboardPage';

const mockModule = { id: 'mod-01', name: 'Module 1', timeHours: 10, prerequisites: [], topics: [] };
const mockCourse = {
  id: 'cs101',
  course: 'CS 101',
  displayName: 'Intro to CS',
  timeBudgetHours: 40,
  targetLevel: 'beginner',
  domain: 'Computer Science',
  prerequisites: [],
  learningObjectives: [],
  modules: [mockModule],
};

function makeInProgress() {
  useCompletionStore.setState({
    completed: { 'cs101:mod-01': true },
    totalModules: { cs101: 2 },
  });
}

describe('DashboardPage', () => {
  const user = userEvent.setup();
  beforeEach(() => {
    void i18n.changeLanguage('en-US');
    clearMocks();
    useSettingsStore.setState({ focusMode: false });
    useCourseStore.setState({
      courses: [],
      loading: false,
      error: null,
      loaded: true,
    });
    useCompletionStore.setState({ completed: {}, totalModules: {} });
    mockResponse('getGlobalStats', {
      totalCourses: 0,
      totalModules: 0,
      totalCompletedModules: 0,
      totalStudyMinutes: 0,
      streak: 0,
      courseSummaries: [],
    });
    mockResponse('getLastSession', null);
    mockResponse('quizIndex', { modules: {}, cumulativeQuizzes: [] });
    mockResponse('hasCumulativeQuiz', false);
  });

  test('shows loading skeleton initially', () => {
    mockResponse('getGlobalStats', new Promise(() => {}));
    const { container } = render(<DashboardPage />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  test('shows empty state when no courses', async () => {
    const { container } = render(<DashboardPage />);
    await waitFor(() => {
      expect(container.textContent).toContain('No courses found');
    });
  });

  test('renders course grid', async () => {
    useCourseStore.setState({ courses: [mockCourse] });
    makeInProgress();
    const { container } = render(<DashboardPage />);
    await waitFor(() => {
      expect(container.textContent).toContain('Intro to CS');
    });
  });

  test('shows resume card when lastSession exists', async () => {
    useCourseStore.setState({ courses: [mockCourse] });
    mockResponse('getLastSession', {
      course: mockCourse,
      module: mockModule,
      sectionId: 'intro',
      scrollPosition: 100,
      updatedAt: '2025-01-15T00:00:00.000Z',
    });
    const { container } = render(<DashboardPage />);
    await waitFor(() => {
      expect(container.textContent).toContain('Resume');
    });
  });

  test('shows stats bar with global stats', async () => {
    mockResponse('getGlobalStats', {
      totalCourses: 2,
      totalModules: 10,
      totalCompletedModules: 4,
      totalStudyMinutes: 240,
      streak: 7,
      courseSummaries: [],
    });
    const { container } = render(<DashboardPage />);
    await waitFor(() => {
      expect(container.textContent).toContain('/10');
    });
  });

  test('snapshot — loading', () => {
    mockResponse('getGlobalStats', new Promise(() => {}));
    const { container } = render(<DashboardPage />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(container.textContent).toContain('Dashboard');
  });

  test('snapshot — loaded with courses', async () => {
    useCourseStore.setState({ courses: [mockCourse] });
    makeInProgress();
    mockResponse('getGlobalStats', {
      totalCourses: 1,
      totalModules: 1,
      totalCompletedModules: 0,
      totalStudyMinutes: 60,
      streak: 3,
      courseSummaries: [],
    });
    const { container } = render(<DashboardPage />);
    await waitFor(() => {
      expect(container.textContent).toContain('Intro to CS');
    });
    expect(container.textContent).toContain('Dashboard');
    expect(container.querySelector('.animate-pulse')).toBeNull();
  });

  test('opens search overlay when search button clicked', async () => {
    const { container } = render(<DashboardPage />);
    await waitFor(() => {
      expect(container.textContent).toContain('Dashboard');
    });
    const searchBtn = container.querySelector('button[title*="Search"]')!;
    await user.click(searchBtn);
    await waitFor(() => {
      expect(container.querySelector('input[placeholder*="Search"]')).toBeTruthy();
    });
  });

  test('clicking settings button navigates to settings', async () => {
    const { useViewStore } = await import('../stores/viewStore');
    const pushSpy = spyOn(useViewStore.getState(), 'push');
    const { container } = render(<DashboardPage />);
    await waitFor(() => {
      expect(container.textContent).toContain('Dashboard');
    });
    const settingsBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.getAttribute('title') === 'Settings',
    )!;
    await user.click(settingsBtn);
    expect(pushSpy).toHaveBeenCalledWith({ type: 'settings' });
    pushSpy.mockRestore();
  });

  test('renders course grid when courses exist', async () => {
    useCourseStore.setState({ courses: [mockCourse] });
    makeInProgress();
    const { container } = render(<DashboardPage />);
    await waitFor(() => {
      expect(container.textContent).toContain('Intro to CS');
    });
    expect(container.querySelector('.animate-pulse')).toBeNull();
  });

  test('shows review-now panel with due quizzes', async () => {
    useCourseStore.setState({ courses: [mockCourse] });
    mockResponse('getGlobalStats', {
      totalCourses: 1,
      totalModules: 1,
      totalCompletedModules: 1,
      totalStudyMinutes: 60,
      streak: 3,
      totalSrsDueCount: 0,
      courseSummaries: [
        {
          courseID: 'cs101',
          courseName: 'Intro to CS',
          completed: 0,
          total: 1,
          lastStudied: null,
          srsDueCount: 0,
          srsTotalCards: 0,
        },
      ],
    });
    mockResponse('quizStatus', {
      courseID: 'cs101',
      modules: [
        {
          moduleId: 'mod-01',
          moduleName: 'Module 1',
          attempt: {
            attempted: true,
            score: 9,
            total: 10,
            date: '2026-07-01',
            due: true,
            overdue: true,
            ready: false,
          },
        },
      ],
      cumulativeQuizzes: [],
    });
    const { container } = render(<DashboardPage />);
    await waitFor(() => {
      expect(container.textContent).toContain('Review now');
    });
    expect(container.textContent).toContain('Intro to CS');
    expect(container.textContent).toContain('1 quiz overdue');
    const row = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Review') && b.textContent?.includes('Intro to CS'),
    );
    expect(row).toBeTruthy();
  });

  test('hides review-now panel when nothing due', async () => {
    useCourseStore.setState({ courses: [mockCourse] });
    makeInProgress();
    mockResponse('quizStatus', {
      courseID: 'cs101',
      modules: [
        {
          moduleId: 'mod-01',
          moduleName: 'Module 1',
          attempt: {
            attempted: true,
            score: 9,
            total: 10,
            date: '2026-08-14',
            due: false,
            overdue: false,
            ready: false,
          },
        },
      ],
      cumulativeQuizzes: [],
    });
    const { container } = render(<DashboardPage />);
    await waitFor(() => {
      expect(container.textContent).toContain('Intro to CS');
    });
    expect(container.textContent).not.toContain('Review now');
  });
});
