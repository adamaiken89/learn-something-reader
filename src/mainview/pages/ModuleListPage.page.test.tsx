import { act, render, type RenderResult } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'bun:test';
import type { ReactElement } from 'react';

import type { Course, ModuleMeta } from '../../bun/types';
import i18n from '../i18n';
import { useCompletionStore } from '../stores/completionStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useViewStore } from '../stores/viewStore';
import { clearMocks, mockResponse, setupRPC } from '../testUtils';

setupRPC();

async function renderAndSettle(ui: ReactElement): Promise<RenderResult> {
  let result!: RenderResult;
  await act(async () => {
    result = render(ui);
    await new Promise((r) => setTimeout(r, 0));
  });
  return result;
}

import ModuleListPage from './ModuleListPage';

const mockModules: ModuleMeta[] = [
  { id: 'mod-01', name: 'Module 1', timeHours: 10, prerequisites: [], topics: ['intro'] },
  { id: 'mod-02', name: 'Module 2', timeHours: 15, prerequisites: [], topics: ['advanced'] },
];

const mockCourse: Course = {
  id: 'cs101',
  course: 'CS 101',
  displayName: 'Intro to CS',
  timeBudgetHours: 40,
  targetLevel: 'beginner',
  domain: 'Computer Science',
  prerequisites: [],
  learningObjectives: [],
  modules: mockModules,
};

describe('ModuleListPage', () => {
  beforeEach(() => {
    clearMocks();
    mockResponse('getCompletedModuleIDs', []);
    void i18n.changeLanguage('en-US');
    useSettingsStore.setState({ focusMode: false });
    useCompletionStore.setState({
      completed: {},
      totalModules: {},
      loading: {},
      loaded: true,
    });
  });

  test('renders all modules', async () => {
    const { container } = await renderAndSettle(<ModuleListPage course={mockCourse} />);
    expect(container.textContent).toContain('Module 1');
    expect(container.textContent).toContain('Module 2');
  });

  test('pushes lesson view when module clicked', async () => {
    useViewStore.setState({ views: [] });
    const { container } = await renderAndSettle(<ModuleListPage course={mockCourse} />);
    const moduleBtns = container.querySelectorAll('button.text-left');
    act(() => (moduleBtns[0] as HTMLButtonElement).click());
    const views = useViewStore.getState().views;
    expect(views).toHaveLength(1);
    const v = views[0];
    expect(v).toMatchObject({ type: 'lesson', course: { id: 'cs101' }, module: { id: 'mod-01' } });
  });

  test('shows completed badge for completed modules', async () => {
    useCompletionStore.setState({
      completed: { 'cs101:mod-01': true },
    });
    const { container } = await renderAndSettle(<ModuleListPage course={mockCourse} />);
    const completedBadge = container.querySelector('.bg-emerald-900\\/50');
    expect(completedBadge).toBeTruthy();
  });

  test('renders CourseSwitcher with courseId', async () => {
    const { container } = await renderAndSettle(<ModuleListPage course={mockCourse} />);
    const switcher = container.querySelector('[data-course-id="cs101"]');
    expect(switcher).toBeTruthy();
    expect(switcher!.getAttribute('data-course-id')).toBe('cs101');
  });

  test('displays module topics', async () => {
    const { container } = await renderAndSettle(<ModuleListPage course={mockCourse} />);
    expect(container.textContent).toContain('intro');
    expect(container.textContent).toContain('advanced');
  });
});
