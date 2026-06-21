const API_PORT = new URLSearchParams(window.location.search).get("apiPort") || "50001";
const BASE = `http://localhost:${API_PORT}/api`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  subjects: {
    list: () => request<any[]>("/subjects"),
    modules: (subjectId: string) => request<any[]>(`/subjects/${subjectId}/modules`),
    lesson: (subjectId: string, moduleId: number) =>
      request<{ content: string }>(`/subjects/${subjectId}/modules/${moduleId}/lesson`),
    quiz: (subjectId: string, moduleId: number) =>
      request<any[]>(`/subjects/${subjectId}/modules/${moduleId}/quiz`),
    sections: (subjectId: string, moduleId: number) =>
      request<any[]>(`/subjects/${subjectId}/modules/${moduleId}/sections`),
    srs: {
      get: (subjectId: string) => request<any>(`/subjects/${subjectId}/srs`),
      filter: (subjectId: string, filter: string) =>
        request<any[]>(`/subjects/${subjectId}/srs/filter/${filter}`),
      toggleStar: (subjectId: string, cardId: string) =>
        request<any>(`/subjects/${subjectId}/srs`, {
          method: "POST",
          body: JSON.stringify({ cardId }),
        }),
      review: (subjectId: string, cardId: string, correct: boolean, deck: any) =>
        request<any>(`/subjects/${subjectId}/srs/review`, {
          method: "POST",
          body: JSON.stringify({ cardId, correct, deck }),
        }),
      create: (subjectId: string, question: any, moduleId: number) =>
        request<any>(`/subjects/${subjectId}/srs/create`, {
          method: "POST",
          body: JSON.stringify({ question, moduleId }),
        }),
    },
  },
  quiz: {
    start: (subjectId: string, moduleId: number) =>
      request<any[]>("/quiz/start", {
        method: "POST",
        body: JSON.stringify({ subjectId, moduleId }),
      }),
    state: () => request<any>("/quiz/state"),
    select: (answer: string) =>
      request<any>("/quiz/select", {
        method: "POST",
        body: JSON.stringify({ answer }),
      }),
    next: () => request<any>("/quiz/next", { method: "POST" }),
    reset: () => request<any>("/quiz/reset", { method: "POST" }),
  },
  storage: {
    highlights: (subjectID: string, moduleID: number) =>
      request<any[]>(`/storage/highlights?subjectID=${encodeURIComponent(subjectID)}&moduleID=${moduleID}`),
    addHighlight: (data: any) =>
      request<any>("/storage/highlights", { method: "POST", body: JSON.stringify(data) }),
    deleteHighlight: (id: string) =>
      request<any>(`/storage/highlights/${id}`, { method: "DELETE" }),
    notes: (subjectID: string, moduleID: number) =>
      request<any[]>(`/storage/notes?subjectID=${encodeURIComponent(subjectID)}&moduleID=${moduleID}`),
    addNote: (data: any) =>
      request<any>("/storage/notes", { method: "POST", body: JSON.stringify(data) }),
    updateNote: (id: string, content: string) =>
      request<any>(`/storage/notes/${id}`, { method: "PUT", body: JSON.stringify({ content }) }),
    deleteNote: (id: string) =>
      request<any>(`/storage/notes/${id}`, { method: "DELETE" }),
    bookmarks: () => request<any[]>("/storage/bookmarks"),
    subjectBookmarks: (subjectID: string) =>
      request<any[]>(`/storage/bookmarks/subject/${subjectID}`),
    moduleBookmarks: (subjectID: string, moduleID: number) =>
      request<any[]>(`/storage/bookmarks/module/${subjectID}/${moduleID}`),
    addBookmark: (data: any) =>
      request<any>("/storage/bookmarks", { method: "POST", body: JSON.stringify(data) }),
    deleteBookmark: (id: string) =>
      request<any>(`/storage/bookmarks/${id}`, { method: "DELETE" }),
    checkBookmark: (subjectID: string, moduleID: number) =>
      request<boolean>(`/storage/check-bookmark?subjectID=${encodeURIComponent(subjectID)}&moduleID=${moduleID}`),
  },
  gemini: {
    hasKey: () => request<{ hasKey: boolean }>("/gemini/key"),
    setKey: (key: string) =>
      request<any>("/gemini/key", { method: "POST", body: JSON.stringify({ key }) }),
    ask: (question: string, context: string) =>
      request<{ response: string }>("/gemini/ask", {
        method: "POST",
        body: JSON.stringify({ question, context }),
      }),
  },
};
