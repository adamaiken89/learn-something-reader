export interface ModuleMeta {
  id: string;
  name: string;
  timeHours: number;
  prerequisites: string[];
  topics: string[];
}

export interface Course {
  id: string;
  course: string;
  timeBudgetHours: number;
  targetLevel: string;
  domain: string;
  prerequisites: string[];
  learningObjectives: string[];
  modules: ModuleMeta[];
  displayName: string;
}

export interface QuizQuestion {
  id: string;
  type?: 'multiple-choice' | 'cloze' | 'tf';
  question: string;
  options: Record<string, string>;
  answer: string;
  explanation: string;
  difficulty: number;
  tags: string[];
}

export interface CumulativeQuiz {
  questions: QuizQuestion[];
}

export interface QuizIndex {
  modules: Record<string, boolean>;
  cumulativeQuizzes: Array<{ id: string; milestone: number }>;
}

export interface SRSCard {
  id: string;
  questionId: string;
  moduleId: string;
  courseId: string;
  question: string;
  answer: string;
  explanation: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  lastReviewed: string | null;
  isStarred: boolean;
  /** FSRS-5: memory stability (days until ~90% retention) */
  stability?: number;
  /** FSRS-5: card difficulty (1=easist, 10=hardest) */
  difficulty?: number;
  /** FSRS-5: how many times forgotten */
  lapses?: number;
  /** FSRS-5: card state (New, Review, Relearning) */
  state?: string;
}

export interface SRSDeck {
  cards: Record<string, SRSCard>;
}

export interface Section {
  id: string;
  heading: string;
  level: number;
  parentID: string | null;
}

export interface Highlight {
  id: string;
  courseID: string;
  moduleID: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  color: string;
  createdAt: string;
}

export interface Note {
  id: string;
  courseID: string;
  moduleID: string;
  highlightID: string | null;
  sectionID: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bookmark {
  id: string;
  courseID: string;
  moduleID: string;
  sectionID: string | null;
  title: string;
  scrollPosition: number;
  createdAt: string;
}

export interface CompletedModule {
  courseID: string;
  moduleID: string;
  completedAt: string;
}

export interface LastSession {
  course: Course;
  module: ModuleMeta;
  sectionId: string;
  scrollPosition: number;
  updatedAt: string;
}

export interface ModuleSession {
  courseId: string;
  moduleId: string;
  sectionId: string;
  scrollPosition: number;
  updatedAt: string;
}

export interface StudySession {
  date: string;
  courseID: string;
  moduleID: string;
  durationMinutes: number;
  type: 'reading' | 'quiz' | 'review';
  score?: number;
  total?: number;
}

export interface QuizSchedule {
  intervalDays: number;
  nextDue: string;
}

export interface StorageData {
  highlights: Highlight[];
  notes: Note[];
  bookmarks: Bookmark[];
  completedModules: CompletedModule[];
  studySessions: StudySession[];
  remoteRepoURL?: string;
  lastSyncedCommit?: string | null;
  lastSyncTime?: string | null;
  lastSession?: LastSession | null;
  moduleSessions?: Record<string, ModuleSession>;
  quizSchedule?: Record<string, QuizSchedule>;
}
