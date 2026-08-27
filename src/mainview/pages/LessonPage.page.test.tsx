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

describe('LessonPage transitions', () => {
  const module2: ModuleMeta = {
    id: 'mod-02',
    name: 'Module 2',
    timeHours: 10,
    prerequisites: [],
    topics: [],
  };
  const twoModuleCourse = { ...mockCourse, modules: [mockModule, module2] };

  beforeEach(() => {
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
    mockResponse('hasCumulativeQuiz', false);
    useSettingsStore.setState({ focusMode: false, transitionStyle: 'none' as const });
    useCourseStore.setState({
      courses: [twoModuleCourse],
      loading: false,
      error: null,
      loaded: true,
    });
    useLessonUIStore.setState({ showPomodoro: false, searchCourseOpen: false });
  });

  function animDiv(container: HTMLElement): HTMLElement | null {
    return container.querySelector('div[class*="anim-"]');
  }

  async function renderAndGoToModule2(style: string) {
    useSettingsStore.setState({ transitionStyle: style as never });
    let container: HTMLElement;
    let rerender: (ui: React.ReactElement) => void;
    await act(async () => {
      const rendered = render(
        <LessonPage course={twoModuleCourse} module={mockModule} onBack={() => {}} />,
      );
      container = rendered.container;
      rerender = rendered.rerender;
    });
    await act(async () => {
      rerender!(<LessonPage course={twoModuleCourse} module={module2} onBack={() => {}} />);
    });
    return container!;
  }

  test('none style applies no animation class', async () => {
    const container = await renderAndGoToModule2('none');
    expect(animDiv(container)).toBeNull();
  });

  test('slide forward applies anim-slide-right', async () => {
    const container = await renderAndGoToModule2('slide');
    expect(animDiv(container)?.className).toContain('anim-slide-right');
  });

  test('slide back applies anim-slide-left', async () => {
    useSettingsStore.setState({ transitionStyle: 'slide' as never });
    let container: HTMLElement;
    let rerender: (ui: React.ReactElement) => void;
    await act(async () => {
      const rendered = render(
        <LessonPage course={twoModuleCourse} module={module2} onBack={() => {}} />,
      );
      container = rendered.container;
      rerender = rendered.rerender;
    });
    await act(async () => {
      rerender!(<LessonPage course={twoModuleCourse} module={mockModule} onBack={() => {}} />);
    });
    expect(animDiv(container!)?.className).toContain('anim-slide-left');
  });

  test('fade applies anim-fade regardless of direction', async () => {
    const container = await renderAndGoToModule2('fade');
    expect(animDiv(container)?.className).toContain('anim-fade');
  });

  test('flip applies anim-flip', async () => {
    const container = await renderAndGoToModule2('flip');
    expect(animDiv(container)?.className).toContain('anim-flip');
  });

  test('animation class clears after timeout', async () => {
    const container = await renderAndGoToModule2('fade');
    expect(animDiv(container)).toBeTruthy();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600));
    });
    expect(animDiv(container)).toBeNull();
  });

  test('same module re-render does not animate', async () => {
    useSettingsStore.setState({ transitionStyle: 'slide' as never });
    let container: HTMLElement;
    let rerender: (ui: React.ReactElement) => void;
    await act(async () => {
      const rendered = render(
        <LessonPage course={twoModuleCourse} module={mockModule} onBack={() => {}} />,
      );
      container = rendered.container;
      rerender = rendered.rerender;
    });
    await act(async () => {
      rerender!(<LessonPage course={twoModuleCourse} module={mockModule} onBack={() => {}} />);
    });
    expect(animDiv(container!)).toBeNull();
  });
});
