import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'bun:test';

import type { CourseQuizStatus, CourseStats } from '../../bun/stats';
import type { Course } from '../../bun/types';
import i18n from '../i18n';
import { useCompletionStore } from '../stores/completionStore';
import { useViewStore } from '../stores/viewStore';
import { clearMocks, mockResponse, setupRPC } from '../testUtils';
import SyllabusPage from './SyllabusPage';

setupRPC();

const makeCourse = (): Course => ({
  id: 'ml101',
  course: 'ml101',
  displayName: 'ML Basics',
  timeBudgetHours: 40,
  targetLevel: 'beginner',
  domain: 'machine_learning',
  prerequisites: ['Basic algebra'],
  learningObjectives: ['Understand gradients', 'Train a model'],
  modules: [
    {
      id: '1',
      name: 'Getting Started',
      timeHours: 2,
      prerequisites: [],
      topics: ['setup', 'tools'],
    },
    {
      id: '2',
      name: 'Variables',
      timeHours: 1,
      prerequisites: ['1'],
      topics: ['a', 'b', 'c', 'd', 'e', 'f'],
    },
    { id: '3', name: 'Control Flow', timeHours: 0, prerequisites: [], topics: [] },
  ],
});

const mockQuizIndex = {
  modules: {
    '1-getting-started': true,
    '3-control-flow': false,
  },
  cumulativeQuizzes: [{ id: 'cumulative_quiz.yaml', milestone: 10 }],
};

const mockQuizStatus: CourseQuizStatus = {
  courseID: 'ml101',
  modules: [
    {
      moduleId: '1',
      moduleName: 'Getting Started',
      attempt: {
        attempted: true,
        score: 4,
        total: 10,
        date: '2026-08-01',
        due: true,
        overdue: true,
        ready: false,
      },
    },
    { moduleId: '2', moduleName: 'Variables', attempt: null },
    {
      moduleId: '3',
      moduleName: 'Control Flow',
      attempt: {
        attempted: false,
        score: 0,
        total: 10,
        date: '',
        due: true,
        overdue: false,
        ready: true,
      },
    },
  ],
  cumulativeQuizzes: [],
};

const mockCourseStats: CourseStats = {
  courseID: 'ml101',
  totalModules: 3,
  completedModules: 0,
  avgQuizScore: 0,
  quizAttempts: 0,
  srsDueCount: 2,
  srsTotalCards: 10,
  moduleSrsDue: { '2': 2 },
  totalStudyMinutes: 0,
  streak: 0,
  recentSessions: [],
};

describe('SyllabusPage', () => {
  const renderPage = async () => {
    let r: ReturnType<typeof render> | undefined;
    await act(async () => {
      r = render(<SyllabusPage course={makeCourse()} onBack={() => {}} />);
    });
    return r!;
  };

  beforeEach(() => {
    clearMocks();
    void i18n.changeLanguage('en-US');
    mockResponse('quizIndex', mockQuizIndex);
    mockResponse('quizStatus', mockQuizStatus);
    mockResponse('getCourseStats', mockCourseStats);
    mockResponse('getCourseModuleSessions', []);
    mockResponse('coursesList', []);
  });

  test('renders hero with display name and formatted domain', async () => {
    const { container } = await renderPage();
    expect(container.textContent).toContain('ML Basics');
    expect(container.textContent).toContain('Machine Learning');
    await waitForQuizStatus(container);
  });

  test('renders prerequisites and learning objectives sections', async () => {
    await new Promise((r) => setTimeout(r, 0));
    const { container } = await renderPage();
    expect(container.textContent).toContain('Prerequisites');
    expect(container.textContent).toContain('Basic algebra');
    expect(container.textContent).toContain('Learning Objectives');
    expect(container.textContent).toContain('Understand gradients');
  });

  test('resolves prereq module names and truncates topic chips', async () => {
    await new Promise((r) => setTimeout(r, 0));
    const { container } = await renderPage();
    expect(container.textContent).toContain('Prereq: Getting Started');
    // 6 topics → first 5 shown, then "+1"
    expect(container.textContent).toContain('+1');
  });

  test('shows quiz due badges and SRS due chip', async () => {
    const { container } = await renderPage();
    await waitForQuizStatus(container);
    expect(container.textContent).toContain('Quiz overdue'); // module 1
    expect(container.textContent).toContain('Quiz ready'); // module 3
    expect(container.textContent).toContain('2 cards due'); // module 2 SRS
  });

  test('shows MCQ button only for modules with a quiz', async () => {
    const { container } = await renderPage();
    await waitForQuizStatus(container);
    const mcqButtons = Array.from(container.querySelectorAll('button')).filter((b) =>
      b.textContent?.includes('MCQ'),
    );
    expect(mcqButtons.length).toBe(2);
  });

  test('fresh course shows Continue without Resume', async () => {
    await new Promise((r) => setTimeout(r, 0));
    const { container } = await renderPage();
    expect(container.textContent).toContain('Continue');
    expect(container.textContent).not.toContain('Resume');
  });

  test('partial progress shows Resume and done/total count', async () => {
    await new Promise((r) => setTimeout(r, 0));
    useCompletionStore.setState({
      completed: { 'ml101:1': true },
      totalModules: { ml101: 3 },
    });
    const { container } = await renderPage();
    expect(container.textContent).toContain('Resume');
    expect(container.textContent).toContain('1/3');
  });

  test('completed course shows Course Complete badge instead of CTAs', async () => {
    await new Promise((r) => setTimeout(r, 0));
    useCompletionStore.setState({
      completed: { 'ml101:1': true, 'ml101:2': true, 'ml101:3': true },
      totalModules: { ml101: 3 },
    });
    const { container } = await renderPage();
    expect(container.textContent).toContain('Course Complete');
    expect(container.textContent).not.toContain('Continue');
  });

  test('Continue pushes first incomplete module', async () => {
    await new Promise((r) => setTimeout(r, 0));
    useCompletionStore.setState({ completed: { 'ml101:1': true }, totalModules: { ml101: 3 } });
    const { getByText } = await renderPage();
    getByText('Continue').closest('button')!.click();
    const views = useViewStore.getState().views;
    const last = views[views.length - 1];
    expect(last.type).toBe('lesson');
    if (last.type === 'lesson') {
      expect(last.module.id).toBe('2');
    }
  });

  test('Resume pushes last session module with sectionID', async () => {
    useCompletionStore.setState({
      completed: { 'ml101:1': true },
      totalModules: { ml101: 3 },
    });
    mockResponse('getCourseModuleSessions', [
      {
        courseId: 'ml101',
        moduleId: '3',
        sectionId: 'sec-9',
        scrollPosition: 120,
        updatedAt: '2026-08-20T10:00:00Z',
      },
    ]);
    const { getByText } = await renderPage();
    getByText('Resume').closest('button')!.click();
    await new Promise((r) => setTimeout(r, 0));
    const views = useViewStore.getState().views;
    const last = views[views.length - 1];
    expect(last.type).toBe('lesson');
    if (last.type === 'lesson') {
      expect(last.module.id).toBe('3');
      expect(last.sectionID).toBe('sec-9');
    }
  });

  test('module row click pushes lesson view', async () => {
    await new Promise((r) => setTimeout(r, 0));
    const { getAllByTestId } = await renderPage();
    getAllByTestId('module-row')[1].click();
    const views = useViewStore.getState().views;
    const last = views[views.length - 1];
    expect(last.type).toBe('lesson');
    if (last.type === 'lesson') {
      expect(last.module.id).toBe('2');
    }
  });

  test('MCQ button pushes quiz without also pushing lesson', async () => {
    const { container } = await renderPage();
    await waitForQuizStatus(container);
    const mcqButton = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('MCQ'),
    )!;
    mcqButton.click();
    const views = useViewStore.getState().views;
    expect(views.length).toBe(1);
    expect(views[0].type).toBe('quiz');
  });

  test('quick actions navigate to cumulative/quizHub/review', async () => {
    const { container } = await renderPage();
    for (let i = 0; i < 50 && !container.textContent?.includes('Cumulative'); i++) {
      await new Promise((r) => setTimeout(r, 10));
    }
    const findBtn = (label: string) =>
      Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes(label))!;
    const topView = () => {
      const views = useViewStore.getState().views;
      return views[views.length - 1].type;
    };
    findBtn('Cumulative').click();
    expect(topView()).toBe('cumulativeQuiz');
    useViewStore.setState({ views: [] });
    findBtn('All Quizzes').click();
    expect(topView()).toBe('quizHub');
    useViewStore.setState({ views: [] });
    findBtn('Review').click();
    expect(topView()).toBe('review');
  });

  test('hides Cumulative action when course has none', async () => {
    mockResponse('quizIndex', { modules: {}, cumulativeQuizzes: [] });
    const { container } = await renderPage();
    await new Promise((r) => setTimeout(r, 0));
    expect(container.textContent).not.toContain('Cumulative');
    expect(container.textContent).toContain('All Quizzes');
  });
});

async function waitForQuizStatus(container: HTMLElement) {
  for (let i = 0; i < 50 && !container.textContent?.includes('MCQ'); i++) {
    await new Promise((r) => setTimeout(r, 10));
  }
}
