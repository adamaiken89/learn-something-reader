import { beforeAll, describe, expect, test } from 'bun:test';

import type { SearchResult } from '../bun/search';
import type { ApiClient } from './api';
import { mockResponse, setupRPC } from './testUtils';

setupRPC();

let api: ApiClient;

beforeAll(async () => {
  const mod = await import('./api');
  api = mod.api;
});

describe('api', () => {
  test('courses.list', async () => {
    const data = [
      {
        id: 'math',
        course: 'Math',
        displayName: 'Math',
        domain: 'math',
        prerequisites: [],
        modules: [],
        timeBudgetHours: 10,
        targetLevel: 'beginner',
        learningObjectives: [],
      },
    ];
    mockResponse('coursesList', data);
    const result = await api.courses.list();
    expect(result).toEqual(data);
  });

  test('courses.modules', async () => {
    const data = [{ id: '01', name: 'Algebra', timeHours: 3, prerequisites: [], topics: [] }];
    mockResponse('modulesList', data);
    const result = await api.courses.modules('math');
    expect(result).toEqual(data);
  });

  test('courses.lesson', async () => {
    const data = { content: '# Algebra', h1: 'Algebra', meta: [], sections: [], bodyContent: '' };
    mockResponse('loadLesson', data);
    const result = await api.courses.lesson('math', '01');
    expect(result.content).toBe('# Algebra');
  });

  test('courses.quiz', async () => {
    const data = [
      {
        id: 'q1',
        question: '?',
        options: { A: '1' },
        answer: 'A',
        explanation: '',
        difficulty: 1,
        tags: [],
      },
    ];
    mockResponse('loadQuiz', data);
    const result = await api.courses.quiz('math', '01');
    expect(result).toHaveLength(1);
  });

  test('courses.srs.get', async () => {
    const data = { cards: {} };
    mockResponse('getSRSDeck', data);
    const result = await api.courses.srs.get('math');
    expect(result).toEqual(data);
  });

  test('search', async () => {
    const data: SearchResult[] = [
      {
        type: 'lesson',
        courseID: 'math',
        courseName: 'Math',
        moduleID: '01',
        moduleName: 'Algebra',
        sectionID: 's1',
        snippet: 'Algebra',
      },
    ];
    mockResponse('search', data);
    const result = await api.search('algebra');
    expect(result).toEqual(data);
  });

  test('search with courseID', async () => {
    mockResponse('search', []);
    const result = await api.search('algebra', 'math');
    expect(result).toEqual([]);
  });

  test('quiz.start', async () => {
    const data = [
      {
        id: 'q1',
        question: '?',
        options: { A: '1' },
        answer: 'A',
        explanation: '',
        difficulty: 1,
        tags: [],
      },
    ];
    mockResponse('quizStart', data);
    const result = await api.quiz.start('math', '01');
    expect(result).toEqual(data);
  });

  test('storage.highlights', async () => {
    const data = [
      {
        id: 'h1',
        courseID: 'math',
        moduleID: '01',
        selectedText: 'text',
        color: 'yellow',
        startOffset: 0,
        endOffset: 4,
        createdAt: '2024-01-01',
      },
    ];
    mockResponse('getHighlights', data);
    const result = await api.storage.highlights('math', '01');
    expect(result).toEqual(data);
  });

  test('storage.addHighlight', async () => {
    const data = {
      id: 'h1',
      courseID: 'math',
      moduleID: '01',
      selectedText: 'text',
      color: 'green',
      startOffset: 0,
      endOffset: 4,
      createdAt: '2024-01-01',
    };
    mockResponse('addHighlight', data);
    const result = await api.storage.addHighlight({
      courseID: 'math',
      moduleID: '01',
      selectedText: 'text',
      startOffset: 0,
      endOffset: 4,
      color: 'green',
    });
    expect(result.color).toBe('green');
  });

  test('sync.status', async () => {
    const data = {
      lastSyncTime: '2024-01-01T00:00:00Z',
      lastSyncedCommit: 'abc',
      isSyncing: false,
      remoteRepoURL: '',
    };
    mockResponse('getSyncStatus', data);
    const result = await api.sync.status();
    expect(result.lastSyncTime).toBe('2024-01-01T00:00:00Z');
  });
});
