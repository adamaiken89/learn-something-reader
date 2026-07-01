import { act } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'bun:test';

import i18n from '../i18n';
import { useSettingsStore } from '../stores/settingsStore';
import { mockResponse, renderAndSettle, setupRPC } from '../testUtils';
import QuizPage from './QuizPage';

setupRPC();

describe('QuizPage', () => {
  const defaultProps = {
    courseId: 'cs101',
    moduleId: 'mod-01',
    onBack: () => {},
  };

  beforeEach(() => {
    mockResponse('quizStart', []);
    void i18n.changeLanguage('en-US');
    useSettingsStore.setState({ focusMode: false });
  });

  test('renders CourseSwitcher with currentCourseId', async () => {
    const { container } = await renderAndSettle(<QuizPage {...defaultProps} />);
    const switcher = container.querySelector('[data-course-id="cs101"]');
    expect(switcher).toBeTruthy();
    expect(switcher!.getAttribute('data-course-id')).toBe('cs101');
  });

  test('renders back button that calls onBack', async () => {
    let called = false;
    const { getByText } = await renderAndSettle(
      <QuizPage
        {...defaultProps}
        onBack={() => {
          called = true;
        }}
      />,
    );
    await act(async () => {
      getByText('← Back').click();
    });
    expect(called).toBe(true);
  });
});
