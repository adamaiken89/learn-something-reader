import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'bun:test';

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
  });

  test('shows loading state initially', () => {
    mockResponse('getGlobalStats', new Promise(() => {}));
    const { container } = render(<DashboardPage />);
    expect(container.textContent).toContain('Loading');
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
      expect(container.textContent).toContain('4/10');
    });
  });
});
