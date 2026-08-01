import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import * as yaml from './yaml';
import { join } from 'path';

import { processLessonMarkdown } from './lessonMarkdown';
import { logger } from './logger';
import { findSubjectsDir, normalizeModuleId } from './utils';

import type { Course, CumulativeQuiz, ModuleMeta, QuizIndex, QuizQuestion, SRSDeck } from './types';

export function parseCourse(yamlStr: string, directory: string): Course | null {
  const raw = yaml.parse(yamlStr) as Record<string, unknown>;
  if (!raw || typeof raw.subject !== 'string' || !raw.subject) return null;

  const moduleList: ModuleMeta[] = [];
  if (Array.isArray(raw.modules)) {
    for (const m of raw.modules) {
      const mod = m as Record<string, unknown>;
      moduleList.push({
        id: normalizeModuleId(mod.id as string | number),
        name: String(mod.name || ''),
        timeHours: Number(mod.time_hours) || 0,
        prerequisites: Array.isArray(mod.prerequisites)
          ? mod.prerequisites.map((p) => normalizeModuleId(p))
          : [],
        topics: Array.isArray(mod.topics) ? mod.topics.map(String) : [],
      });
    }
  }

  return {
    id: directory,
    course: String(raw.subject),
    timeBudgetHours: Number(raw.time_budget_hours) || 40,
    targetLevel: String(raw.target_level || 'intermediate'),
    domain: String(raw.domain || ''),
    prerequisites: Array.isArray(raw.prerequisites) ? raw.prerequisites.map(String) : [],
    learningObjectives: Array.isArray(raw.learning_objectives)
      ? raw.learning_objectives.map(String)
      : [],
    modules: moduleList,
    displayName: String(raw.subject),
  };
}

function makeQuestion(q: Record<string, unknown>): QuizQuestion {
  const type = q.type === 'cloze' ? 'cloze' : q.type === 'tf' ? 'tf' : undefined;
  let options = (q.options as Record<string, string>) || {};
  const answer = String(q.answer !== undefined && q.answer !== null ? q.answer : '');

  if (type === 'tf' && Object.keys(options).length === 0) {
    options = { True: 'True', False: 'False' };
  }

  return {
    id: String(q.id || ''),
    type,
    question: String(q.question || ''),
    options,
    answer,
    explanation: String(q.explanation || ''),
    difficulty: Number(q.difficulty) || 1,
    tags: Array.isArray(q.tags) ? q.tags.map(String) : [],
  };
}

export function parseQuiz(yamlStr: string): QuizQuestion[] {
  const raw = yaml.parse(yamlStr) as Record<string, unknown>[];
  if (!Array.isArray(raw)) return [];

  return raw.map(makeQuestion);
}

export function findModuleDir(
  coursesDir: string,
  courseId: string,
  moduleId: string,
): string | null {
  const modulesDir = join(coursesDir, courseId, 'modules');
  if (!existsSync(modulesDir)) return null;
  const entries = readdirSync(modulesDir, { withFileTypes: true });
  const match = entries.find((e) => e.isDirectory() && e.name.startsWith(moduleId + '-'));
  return match ? join(modulesDir, match.name) : null;
}

export function loadCourses(): Course[] {
  const coursesDir = findSubjectsDir();
  if (!coursesDir) return [];

  const entries = readdirSync(coursesDir, { withFileTypes: true });
  const courses: Course[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === 'srs') continue;
    const syllabusPath = join(coursesDir, entry.name, 'syllabus.yaml');
    if (!existsSync(syllabusPath)) continue;
    try {
      const content = readFileSync(syllabusPath, 'utf-8');
      const course = parseCourse(content, entry.name);
      if (course) courses.push(course);
    } catch (e) {
      logger.warn({ err: (e as Error).message, course: entry.name }, 'Failed to parse syllabus');
    }
  }

  return courses.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export function loadLesson(courseId: string, moduleId: string): string {
  const coursesDir = findSubjectsDir();
  if (!coursesDir) throw new Error('Courses directory not found');
  const modDir = findModuleDir(coursesDir, courseId, moduleId);
  if (!modDir) throw new Error(`Module ${moduleId} not found for course ${courseId}`);
  const lessonPath = join(modDir, 'lesson.md');
  if (!existsSync(lessonPath)) throw new Error(`Lesson not found for module ${moduleId}`);
  return readFileSync(lessonPath, 'utf-8');
}

export function loadClozeQuiz(courseId: string, moduleId: string): QuizQuestion[] {
  const coursesDir = findSubjectsDir();
  if (!coursesDir) throw new Error('Courses directory not found');
  const modDir = findModuleDir(coursesDir, courseId, moduleId);
  if (!modDir) throw new Error(`Module ${moduleId} not found for course ${courseId}`);
  const clozePath = join(modDir, 'cloze.yaml');
  if (!existsSync(clozePath)) return [];
  const content = readFileSync(clozePath, 'utf-8');
  const raw = yaml.parse(content) as Record<string, unknown>[];
  if (!Array.isArray(raw)) return [];
  return raw.map((q) => ({
    id: String(q.id || ''),
    type: 'cloze' as const,
    question: String(q.text || q.question || ''),
    options: {} as Record<string, string>,
    answer: String(q.answer || ''),
    explanation: String(q.explanation || ''),
    difficulty: Number(q.difficulty) || 1,
    tags: Array.isArray(q.tags) ? q.tags.map(String) : [],
  }));
}

/// Answers for a cloze question are ALL `{term}` markers; multi-blank questions
/// need the full set comma-joined so generic `ua === q.answer` scoring works.
export function normalizedClozeAnswer(questionText: string, rawAnswer: string): string {
  const terms = [...questionText.matchAll(/\{([^{}]+)\}/g)]
    .map((m) => m[1])
    .filter((t) => t.trim().toLowerCase() !== 'blank');
  return terms.length > 0 ? terms.join(', ') : rawAnswer;
}

export function loadCombinedQuiz(courseId: string, moduleId: string): QuizQuestion[] {
  const mcq = loadQuiz(courseId, moduleId);
  const cloze = loadClozeQuiz(courseId, moduleId).map((q) => ({
    ...q,
    answer: normalizedClozeAnswer(q.question, q.answer),
  }));
  return [...mcq, ...cloze];
}

export function parseCumulativeQuiz(yamlStr: string): CumulativeQuiz {
  const raw = yaml.parse(yamlStr) as
    | Record<string, unknown>[]
    | { questions: Record<string, unknown>[] }
    | null;
  if (Array.isArray(raw)) {
    return { questions: raw.map(makeQuestion) };
  }
  if (raw && Array.isArray(raw.questions)) {
    return { questions: raw.questions.map(makeQuestion) };
  }
  return { questions: [] };
}

export function resolveDefaultCumulativeQuiz(coursesDir: string, courseId: string): string | null {
  const courseDir = join(coursesDir, courseId);
  if (!existsSync(courseDir)) return null;
  const files = readdirSync(courseDir, { withFileTypes: true }).filter(
    (e) => e.isFile() && e.name.startsWith('cumulative_quiz') && e.name.endsWith('.yaml'),
  );
  if (files.some((e) => e.name === 'cumulative_quiz.yaml')) return 'cumulative_quiz.yaml';
  const numbered = files
    .filter((e) => /^cumulative_quiz_(\d+)(?:-(\d+))?\.yaml$/.test(e.name))
    .sort((a, b) => {
      const start = (n: string) => Number(n.match(/^cumulative_quiz_(\d+)/)?.[1] ?? Infinity);
      return start(a.name) - start(b.name);
    });
  return numbered[0]?.name ?? null;
}

export function loadCumulativeQuiz(courseId: string, id?: string): CumulativeQuiz {
  const coursesDir = findSubjectsDir();
  if (!coursesDir) throw new Error('Courses directory not found');
  const filename =
    id ?? resolveDefaultCumulativeQuiz(coursesDir, courseId) ?? 'cumulative_quiz.yaml';
  const quizPath = join(coursesDir, courseId, filename);
  if (!existsSync(quizPath)) return { questions: [] };
  const content = readFileSync(quizPath, 'utf-8');
  return parseCumulativeQuiz(content);
}

export function hasCumulativeQuiz(courseId: string): boolean {
  const coursesDir = findSubjectsDir();
  if (!coursesDir) return false;
  const entries = readdirSync(coursesDir + '/' + courseId, { withFileTypes: true });
  return entries.some((e) => e.isFile() && e.name.startsWith('cumulative_quiz'));
}

export function getQuizIndex(courseId: string): QuizIndex {
  const coursesDir = findSubjectsDir();
  if (!coursesDir) return { modules: {}, cumulativeQuizzes: [] };

  const modulesDir = join(coursesDir, courseId, 'modules');
  const modules: Record<string, boolean> = {};

  if (existsSync(modulesDir)) {
    const entries = readdirSync(modulesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const modPath = join(modulesDir, entry.name);
      const hasQuiz =
        existsSync(join(modPath, 'quiz.yaml')) || existsSync(join(modPath, 'cloze.yaml'));
      if (hasQuiz) {
        modules[entry.name] = true;
      }
    }
  }

  const courseDir = join(coursesDir, courseId);
  const cumulativeQuizzes: Array<{ id: string; milestone: number }> = [];

  if (existsSync(courseDir)) {
    const entries = readdirSync(courseDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const singleMatch = entry.name.match(/^cumulative_quiz_(\d+).yaml$/);
      if (singleMatch) {
        cumulativeQuizzes.push({ id: entry.name, milestone: Number(singleMatch[1]) });
        continue;
      }
      const rangeMatch = entry.name.match(/^cumulative_quiz_(\d+)-(\d+).yaml$/);
      if (rangeMatch) {
        cumulativeQuizzes.push({ id: entry.name, milestone: Number(rangeMatch[2]) });
        continue;
      }
    }
    // also check plain cumulative_quiz.yaml (no numbered suffix)
    if (entries.some((e) => e.name === 'cumulative_quiz.yaml')) {
      const moduleCount = Object.keys(modules).length;
      cumulativeQuizzes.push({ id: 'cumulative_quiz.yaml', milestone: moduleCount });
    }
  }

  const sortedModules = Object.fromEntries(
    Object.entries(modules).sort(([a], [b]) => {
      const an = parseInt(a, 10);
      const bn = parseInt(b, 10);
      if (!isNaN(an) && !isNaN(bn)) return an - bn;
      return a.localeCompare(b);
    }),
  );
  cumulativeQuizzes.sort((a, b) => a.milestone - b.milestone);
  return { modules: sortedModules, cumulativeQuizzes };
}

export function loadQuiz(courseId: string, moduleId: string): QuizQuestion[] {
  const coursesDir = findSubjectsDir();
  if (!coursesDir) throw new Error('Courses directory not found');
  const modDir = findModuleDir(coursesDir, courseId, moduleId);
  if (!modDir) throw new Error(`Module ${moduleId} not found for course ${courseId}`);
  const quizPath = join(modDir, 'quiz.yaml');
  if (!existsSync(quizPath)) return [];
  const content = readFileSync(quizPath, 'utf-8');
  return parseQuiz(content);
}

export function loadSRSDeck(courseId: string): SRSDeck {
  const coursesDir = findSubjectsDir();
  if (!coursesDir) return { cards: {} };
  const deckPath = join(coursesDir, courseId, 'srs', 'deck.json');
  if (!existsSync(deckPath)) return { cards: {} };
  try {
    return JSON.parse(readFileSync(deckPath, 'utf-8')) as SRSDeck;
  } catch (e) {
    logger.warn({ err: (e as Error).message, courseId }, 'Failed to load SRS deck, using empty');
    return { cards: {} };
  }
}

export function saveSRSDeck(deck: SRSDeck, courseId: string): void {
  const coursesDir = findSubjectsDir();
  if (!coursesDir) return;
  const srsDir = join(coursesDir, courseId, 'srs');
  mkdirSync(srsDir, { recursive: true });
  writeFileSync(join(srsDir, 'deck.json'), JSON.stringify(deck, null, 2));
}

export function parseSections(
  markdown: string,
): { id: string; heading: string; level: number; parentID: string | null }[] {
  return processLessonMarkdown(markdown).sections;
}
