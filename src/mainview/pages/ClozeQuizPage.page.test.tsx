import { act, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'bun:test';

import type { Course, ModuleMeta } from '../../bun/types';
import i18n from '../i18n';
import { useSettingsStore } from '../stores/settingsStore';
import { clearMocks, mockResponse, setupRPC } from '../testUtils';
import ClozeQuizPage from './ClozeQuizPage';

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

describe('ClozeQuizPage', () => {
  const user = userEvent.setup();
  const defaultProps = {
    course: mockCourse,
    module: mockModule,
    onBack: () => {},
  };

  beforeEach(() => {
    clearMocks();
    void i18n.changeLanguage('en-US');
    useSettingsStore.setState({ focusMode: false });
    mockResponse('loadClozeQuiz', []);
    mockResponse('getLastQuizSession', null);
  });

  test('snapshot — loading', () => {
    mockResponse('loadClozeQuiz', new Promise(() => {}));
    mockResponse('getLastQuizSession', new Promise(() => {}));
    const { container } = render(<ClozeQuizPage {...defaultProps} />);
    expect(container.textContent).toContain('Module 1');
    expect(container.textContent).toContain('Cloze Drill');
  });

  test('snapshot — loaded', async () => {
    let container: HTMLElement;
    await act(async () => {
      container = render(<ClozeQuizPage {...defaultProps} />).container;
    });
    expect(container!.textContent).toContain('Module 1');
    await waitFor(() => {
      expect(container!.textContent).toContain('Cloze Drill');
      expect(container!.querySelector('.animate-pulse')).toBeNull();
    });
  });

  test('renders module name in header', async () => {
    let container: HTMLElement;
    await act(async () => {
      container = render(<ClozeQuizPage {...defaultProps} />).container;
    });
    expect(container!.textContent).toContain('Module 1');
    await waitFor(() => expect(container!.textContent).toContain('Cloze Drill'));
  });

  test('calls onBack when back button clicked', async () => {
    let called = false;
    let getByText: ReturnType<typeof render>['getByText'];
    await act(async () => {
      getByText = render(
        <ClozeQuizPage
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
});
