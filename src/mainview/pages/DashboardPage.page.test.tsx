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
    mockResponse('hasClozeQuiz', false);
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
    const { container } = render(<DashboardPage />);
    await waitFor(() => {
      expect(container.textContent).toContain('Intro to CS');
    });
    expect(container.querySelector('.animate-pulse')).toBeNull();
  });
});
