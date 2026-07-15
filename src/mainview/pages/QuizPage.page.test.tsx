import { act, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'bun:test';

import type { Course, ModuleMeta } from '../../bun/types';
import i18n from '../i18n';
import { useSettingsStore } from '../stores/settingsStore';
import { mockResponse, setupRPC } from '../testUtils';
import QuizPage from './QuizPage';

setupRPC();

const mockModule: ModuleMeta = {
  id: 'mod-01',
  name: 'Module 1',
  timeHours: 10,
  prerequisites: [],
  topics: [],
};
const mockCourse: Course = {
  id: 'cs101',
  course: 'cs101',
  displayName: 'CS 101',
  timeBudgetHours: 100,
  targetLevel: 'beginner',
  domain: 'computer science',
  prerequisites: [],
  learningObjectives: [],
  modules: [mockModule],
};

describe('QuizPage', () => {
  const user = userEvent.setup();
  const defaultProps = {
    course: mockCourse,
    module: mockModule,
    onBack: () => {},
  };

  beforeEach(() => {
    mockResponse('coursesList', []);
    mockResponse('quizStart', []);
    mockResponse('getLastQuizSession', null);
    void i18n.changeLanguage('en-US');
    useSettingsStore.setState({ focusMode: false });
  });

  test('renders CourseSwitcher with currentCourseId', async () => {
    let container: HTMLElement;
    await act(async () => {
      container = render(<QuizPage {...defaultProps} />).container;
    });
    const switcher = container!.querySelector('[data-course-id="cs101"]');
    expect(switcher).toBeTruthy();
    expect(switcher!.getAttribute('data-course-id')).toBe('cs101');
  });

  test('renders back button that calls onBack', async () => {
    let called = false;
    let getByText: ReturnType<typeof render>['getByText'];
    await act(async () => {
      getByText = render(
        <QuizPage
          {...defaultProps}
          onBack={() => {
            called = true;
          }}
        />,
      ).getByText;
    });
    await user.click(getByText!('← Back'));
    expect(called).toBe(true);
  });

  test('snapshot — loaded', async () => {
    let container: HTMLElement;
    await act(async () => {
      container = render(<QuizPage {...defaultProps} />).container;
    });
    const switcher = container!.querySelector('[data-course-id="cs101"]');
    expect(switcher).toBeTruthy();
    await waitFor(() => expect(container!.textContent).toContain('← Back'));
  });
});
