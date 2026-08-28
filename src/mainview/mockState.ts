export const mockResponses = new Map<string, unknown>();

export const defaultMocks: Record<string, unknown> = {
  setWindowTitle: undefined,
  openExternal: { ok: true },
  getDueCardsCount: 0,
  quizIndex: { modules: {}, cumulativeQuizzes: [] },
};

export function clearMocks() {
  mockResponses.clear();
}
