import { beforeEach, describe, expect, test } from 'bun:test';

import type { ModuleMeta } from '../../bun/types';
import { useCourseStore } from '../stores/courseStore';
import { useLessonUIStore } from '../stores/lessonUIStore';
import { useSettingsStore } from '../stores/settingsStore';
import { mockResponse, renderAndSettle, setupRPC } from '../testUtils';
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
  beforeEach(() => {
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
    useSettingsStore.setState({ focusMode: false });
    useCourseStore.setState({
      courses: [mockCourse],
      loading: false,
      error: null,
      loaded: true,
    });
    useLessonUIStore.setState({
      showTools: false,
      showPomodoro: false,
      searchCourseOpen: false,
    });
  });

  test('renders ModuleSwitcher with current module', async () => {
    const { container } = await renderAndSettle(ui);
    const switcher = container.querySelector('[data-testid="module-switcher"]');
    expect(switcher).toBeTruthy();
    expect(switcher!.getAttribute('data-current-module-id')).toBe('mod-01');
  });

  test('renders LessonToolbar', async () => {
    const { container } = await renderAndSettle(ui);
    expect(container.querySelector('[data-testid="lesson-toolbar"]')).toBeTruthy();
  });

  test('calls onBack when back button clicked', async () => {
    let called = false;
    const { getByText } = await renderAndSettle(
      <LessonPage
        course={mockCourse}
        module={mockModule}
        onBack={() => {
          called = true;
        }}
      />,
    );
    getByText('Intro to CS').click();
    expect(called).toBe(true);
  });

  test('passes course displayName as backLabel', async () => {
    const { getByText } = await renderAndSettle(ui);
    expect(getByText('Intro to CS')).toBeInTheDocument();
  });
});
