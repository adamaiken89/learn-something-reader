import { act, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'bun:test';

import i18n from '../i18n';
import { useSettingsStore } from '../stores/settingsStore';
import { mockResponse, setupRPC } from '../testUtils';
import UserCardReviewPage from './UserCardReviewPage';

setupRPC();

describe('UserCardReviewPage', () => {
  const user = userEvent.setup();
  const defaultProps = {
    courseId: 'cs101',
    onBack: () => {},
  };

  beforeEach(() => {
    mockResponse('coursesList', []);
    mockResponse('getUserCards', []);
    void i18n.changeLanguage('en-US');
    useSettingsStore.setState({ focusMode: false });
  });

  test('renders CourseSwitcher with currentCourseId', async () => {
    let container: HTMLElement;
    await act(async () => {
      container = render(<UserCardReviewPage {...defaultProps} />).container;
    });
    const switcher = container!.querySelector('[data-course-id="cs101"]');
    expect(switcher).toBeTruthy();
    expect(switcher!.getAttribute('data-course-id')).toBe('cs101');
  });

  test('calls onBack when back button clicked', async () => {
    let called = false;
    let getByText: ReturnType<typeof render>['getByText'];
    await act(async () => {
      getByText = render(
        <UserCardReviewPage
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
      container = render(<UserCardReviewPage {...defaultProps} />).container;
    });
    const switcher = container!.querySelector('[data-course-id="cs101"]');
    expect(switcher).toBeTruthy();
    await waitFor(() => expect(container!.textContent).toContain('← Back'));
  });
});
