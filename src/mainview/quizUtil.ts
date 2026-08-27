import type { QuizQuestion } from '../bun/types';

/** Fisher–Yates shuffle, new array each call. */
export function shuffleQuestions(qs: QuizQuestion[]): QuizQuestion[] {
  const arr = [...qs];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

export function parseClozeText(text: string): {
  segments: Array<{ type: 'text' | 'blank'; value: string }>;
  answers: string[];
} {
  const regex = /\{([^}]+)\}/g;
  const segments: Array<{ type: 'text' | 'blank'; value: string }> = [];
  const answers: string[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ type: 'text', value: text.slice(last, match.index) });
    }
    const term = match[1];
    if (term.toLowerCase() === 'blank') {
      segments.push({ type: 'blank', value: '' });
    } else {
      segments.push({ type: 'blank', value: term });
      answers.push(term);
    }
    last = regex.lastIndex;
  }
  if (last < text.length) {
    segments.push({ type: 'text', value: text.slice(last) });
  }
  return { segments, answers };
}

/** All `{term}` answers in a cloze question; falls back to `[q.answer]`. */
function clozeAnswers(q: QuizQuestion): string[] {
  const parsed = parseClozeText(q.question).answers;
  return parsed.length > 0 ? parsed : [q.answer];
}

/** Case/whitespace-insensitive compare against comma-joined parsed answers. */
export function clozeCorrect(q: QuizQuestion, ua: string | undefined): boolean {
  if (ua === undefined) return false;
  const expected = clozeAnswers(q)
    .map((a) => a.trim().toLowerCase())
    .join(', ');
  return ua.trim().toLowerCase() === expected;
}

/**
 * Rewrite `answer` of cloze questions to the comma-joined `{term}` set so generic
 * `ua === q.answer` scoring survives multi-blank questions. Non-cloze untouched.
 */
export function normalizeClozeBlanks(qs: QuizQuestion[]): QuizQuestion[] {
  return qs.map((q) => {
    if (q.type !== 'cloze') return q;
    const answers = parseClozeText(q.question).answers;
    return answers.length > 0 ? { ...q, answer: answers.join(', ') } : q;
  });
}
