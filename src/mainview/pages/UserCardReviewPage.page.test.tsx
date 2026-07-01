import { act } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'bun:test';

import i18n from '../i18n';
import { useSettingsStore } from '../stores/settingsStore';
import { mockResponse, renderAndSettle, setupRPC } from '../testUtils';
import UserCardReviewPage from './UserCardReviewPage';

setupRPC();

describe('UserCardReviewPage', () => {
  const defaultProps = {
    courseId: 'cs101',
    onBack: () => {},
  };

  beforeEach(() => {
    mockResponse('getUserCards', []);
    void i18n.changeLanguage('en-US');
    useSettingsStore.setState({ focusMode: false });
  });

  test('renders CourseSwitcher with currentCourseId', async () => {
    const { container } = await renderAndSettle(<UserCardReviewPage {...defaultProps} />);
    const switcher = container.querySelector('[data-course-id="cs101"]');
    expect(switcher).toBeTruthy();
    expect(switcher!.getAttribute('data-course-id')).toBe('cs101');
  });

  test('calls onBack when back button clicked', async () => {
    let called = false;
    const { getByText } = await renderAndSettle(
      <UserCardReviewPage
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
