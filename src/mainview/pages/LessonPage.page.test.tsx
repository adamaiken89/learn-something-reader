import { act, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'bun:test';

import type { ModuleMeta } from '../../bun/types';
import i18n from '../i18n';
import { useCourseStore } from '../stores/courseStore';
import { useLessonUIStore } from '../stores/lessonUIStore';
import { useSettingsStore } from '../stores/settingsStore';
import { mockResponse, setupRPC } from '../testUtils';
import LessonPage from './LessonPage';

setupRPC();

const mockModule: ModuleMeta = {
  id: 'mod-01',
  name: 'Module 1',
  timeHours: 10,
  prerequisites: [],
  topics: ['intro'],
};

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

const ui = <LessonPage course={mockCourse} module={mockModule} onBack={() => {}} />;

describe('LessonPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true,
      configurable: true,
    });
    void i18n.changeLanguage('en-US');
    mockResponse('loadLesson', {
      content: '# Test',
      h1: '',
      meta: [],
      sections: [],
      bodyContent: '',
    });
    mockResponse('isModuleCompleted', false);
    mockResponse('modulesList', []);
    mockResponse('getModuleBookmarks', []);
    mockResponse('getHighlights', []);
    mockResponse('getNotes', []);
    mockResponse('getCompletedModuleIDs', []);
    mockResponse('getSections', []);
    mockResponse('getCourseModuleSessions', []);
    mockResponse('setLastSession', { ok: true });
    mockResponse('setModuleSession', { ok: true });
    mockResponse('hasClozeQuiz', false);
    mockResponse('hasCumulativeQuiz', false);
    useSettingsStore.setState({ focusMode: false });
    useCourseStore.setState({
      courses: [mockCourse],
      loading: false,
      error: null,
      loaded: true,
    });
    useLessonUIStore.setState({
      showPomodoro: false,
      searchCourseOpen: false,
    });
  });

  test('renders module badge with current position', async () => {
    let container: HTMLElement;
    await act(async () => {
      container = render(ui).container;
    });
    await waitFor(() => expect(container!.textContent).toContain('M1/1'));
  });

  test('hides LessonToolbar in normal mode', async () => {
    let container: HTMLElement;
    await act(async () => {
      container = render(ui).container;
    });
    await waitFor(() => {
      expect(container!.querySelector('[data-testid="lesson-toolbar"]')).toBeNull();
    });
  });

  test('calls onBack when back button clicked', async () => {
    let called = false;
    let getByText: ReturnType<typeof render>['getByText'];
    await act(async () => {
      getByText = render(
        <LessonPage
          course={mockCourse}
          module={mockModule}
          onBack={() => {
            called = true;
          }}
        />,
      ).getByText;
    });
    await user.click(getByText!('← Back'));
    expect(called).toBe(true);
  });

  test('renders back button', async () => {
    let getByText: ReturnType<typeof render>['getByText'];
    await act(async () => {
      getByText = render(ui).getByText;
    });
    expect(getByText!('← Back')).toBeInTheDocument();
  });

  test('snapshot — loaded', async () => {
    let container: HTMLElement;
    await act(async () => {
      container = render(ui).container;
    });
    await waitFor(() => {
      expect(container!.textContent).toContain('M1/1');
      expect(container!.textContent).toContain('← Back');
      expect(container!.querySelector('[data-testid="markdown"]')).toBeTruthy();
    });
  });

  test('shows LessonToolbar in focus mode', async () => {
    useSettingsStore.setState({ focusMode: true });
    let container: HTMLElement;
    await act(async () => {
      container = render(ui).container;
    });
    await waitFor(() => {
      expect(container!.querySelector('[data-testid="lesson-toolbar"]')).toBeTruthy();
    });
  });
});
