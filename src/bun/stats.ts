import * as CourseLoader from './courseLoader';
import * as StorageProgress from './persistence-progress';
import * as SRS from './srs';

export interface CourseStats {
  courseID: string;
  totalModules: number;
  completedModules: number;
  avgQuizScore: number;
  quizAttempts: number;
  srsDueCount: number;
  srsTotalCards: number;
  totalStudyMinutes: number;
  streak: number;
  recentSessions: {
    date: string;
    type: string;
    durationMinutes: number;
    score?: number;
    total?: number;
  }[];
}

export interface GlobalStats {
  totalCourses: number;
  totalModules: number;
  totalCompletedModules: number;
  totalStudyMinutes: number;
  streak: number;
  totalSrsDueCount: number;
  courseSummaries: {
    courseID: string;
    courseName: string;
    completed: number;
    total: number;
    lastStudied: string | null;
  }[];
}

export function getCourseStats(courseID: string): CourseStats {
  const courses = CourseLoader.loadCourses();
  const course = courses.find((c) => c.id === courseID);
  if (!course) throw new Error(`Course ${courseID} not found`);

  const totalModules = course.modules.length;
  const completedModules = StorageProgress.getCompletedModuleCount(courseID);
  const sessions = StorageProgress.getStudySessions(courseID, 90);
  const totalStudyMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  const quizSessions = sessions.filter(
    (s) => s.type === 'quiz' && s.score != null && s.total != null,
  );
  const avgQuizScore =
    quizSessions.length > 0
      ? Math.round(
          quizSessions.reduce((sum, s) => sum + (s.score! / s.total!) * 100, 0) /
            quizSessions.length,
        )
      : 0;

  const deck = CourseLoader.loadSRSDeck(courseID);
  const allCards = SRS.getCardsForCourse(deck, courseID);
  const dueCards = SRS.getDueCardsForCourse(deck, courseID);

  return {
    courseID,
    totalModules,
    completedModules,
    avgQuizScore,
    quizAttempts: quizSessions.length,
    srsDueCount: dueCards.length,
    srsTotalCards: allCards.length,
    totalStudyMinutes,
    streak: StorageProgress.getDailyStreak(),
    recentSessions: sessions.slice(0, 20).map((s) => ({
      date: s.date,
      type: s.type,
      durationMinutes: s.durationMinutes,
      score: s.score,
      total: s.total,
    })),
  };
}

export function getGlobalStats(): GlobalStats {
  const courses = CourseLoader.loadCourses();
  const allSessions = StorageProgress.getGlobalStudySessions(90);
  const totalStudyMinutes = allSessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  let totalCompletedModules = 0;
  let totalSrsDueCount = 0;
  const courseSummaries: GlobalStats['courseSummaries'] = [];

  for (const course of courses) {
    const completed = StorageProgress.getCompletedModuleCount(course.id);
    totalCompletedModules += completed;
    const sessions = StorageProgress.getStudySessions(course.id, 90);
    const lastStudied = sessions.length > 0 ? sessions[0].date : null;
    courseSummaries.push({
      courseID: course.id,
      courseName: course.displayName,
      completed,
      total: course.modules.length,
      lastStudied,
    });

    const deck = CourseLoader.loadSRSDeck(course.id);
    totalSrsDueCount += SRS.getDueCardsForCourse(deck, course.id).length;
  }

  return {
    totalCourses: courses.length,
    totalModules: courses.reduce((sum, c) => sum + c.modules.length, 0),
    totalCompletedModules,
    totalStudyMinutes,
    streak: StorageProgress.getDailyStreak(),
    totalSrsDueCount,
    courseSummaries,
  };
}
