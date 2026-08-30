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
export function clozeAnswers(q: QuizQuestion): string[] {
  const parsed = parseClozeText(q.question).answers;
  return parsed.length > 0 ? parsed : [q.answer];
}

/** Normalize a single blank: lowercase, collapse whitespace, strip trailing punctuation. */
function normalizeBlank(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?]+$/, '');
}

/** True when `b` is within one edit of `a`: single substitution, single
 * insertion/deletion, or one adjacent transposition (plain Levenshtein counts
 * a swap as 2 edits, but it's the most common real typo). */
function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length === b.length) {
    const diffs: number[] = [];
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) diffs.push(i);
    }
    if (diffs.length === 1) return true;
    return (
      diffs.length === 2 &&
      diffs[1] === diffs[0] + 1 &&
      a[diffs[0]] === b[diffs[1]] &&
      a[diffs[1]] === b[diffs[0]]
    );
  }
  if (Math.abs(a.length - b.length) !== 1) return false;
  const [short, long] = a.length < b.length ? [a, b] : [b, a];
  let i = 0;
  while (i < short.length && short[i] === long[i]) i++;
  return short.slice(i) === long.slice(i + 1);
}

/**
 * Per-blank compare: normalized (case/whitespace/trailing-punctuation) equality,
 * or one typo (substitution/insertion/deletion/adjacent swap) for words ≥ 4 chars.
 */
export function blankCorrect(expected: string, user: string): boolean {
  const e = normalizeBlank(expected);
  const u = normalizeBlank(user);
  if (u === '') return false;
  if (u === e) return true;
  return e.length >= 4 && withinOneEdit(e, u);
}

/**
 * Per-blank scoring. The stored user answer is the comma-joined blank set.
 * Blank order is fixed (each input maps to its own blank), so partial credit
 * is `correctBlanks / totalBlanks`.
 */
export function clozeScore(
  q: QuizQuestion,
  ua: string | undefined,
): { correctBlanks: number; totalBlanks: number; results: boolean[] } {
  const answers = clozeAnswers(q);
  // Single expected answer: compare the whole user string. Covers both one
  // `{term}` and the `{blank}`-directive fallback where the author comma-joined
  // all terms in `answer` (e.g. "trace_id, finally").
  if (answers.length === 1) {
    const ok = blankCorrect(answers[0], ua ?? '');
    return { correctBlanks: ok ? 1 : 0, totalBlanks: 1, results: [ok] };
  }
  const userBlanks =
    ua === undefined
      ? []
      : ua
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s !== '');
  const results = answers.map((expected, i) =>
    userBlanks[i] !== undefined ? blankCorrect(expected, userBlanks[i]) : false,
  );
  return {
    correctBlanks: results.filter(Boolean).length,
    totalBlanks: answers.length,
    results,
  };
}

/** Fully correct when every blank matches. Shared by the two-attempt rule,
 * session-log scoring and display scoring — single source of truth. */
export function clozeCorrect(q: QuizQuestion, ua: string | undefined): boolean {
  if (ua === undefined) return false;
  const { correctBlanks, totalBlanks } = clozeScore(q, ua);
  return correctBlanks === totalBlanks;
}

/** Points earned for one question: cloze earns 1 per correct blank (partial
 * credit), mcq/tf 1 or 0. */
export function questionPoints(q: QuizQuestion, ua: string | undefined): number {
  if (q.type === 'cloze') return clozeScore(q, ua).correctBlanks;
  return ua === q.answer ? 1 : 0;
}

/** Total achievable points for a question set: one per blank, one per mcq/tf. */
export function totalPointsFor(qs: QuizQuestion[]): number {
  return qs.reduce((sum, q) => sum + (q.type === 'cloze' ? clozeAnswers(q).length : 1), 0);
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
