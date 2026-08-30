export type AISkillId = 'feynman' | 'reframe' | 'drill';

export interface AISkill {
  id: AISkillId;
  label: string;
  buildPrompt(context: string, hint?: string, userExplanation?: string): string;
}

const feynmanPrompt = (context: string, hint?: string, userExplanation?: string) =>
  [
    userExplanation ? `${userExplanation}\n` : '',
    'You are a curious 12-year-old checking my understanding. Reason step by step about my explanation first, then respond in exactly 3 sections:',
    '(1) Got right — what my explanation correctly explains. List it.',
    '(2) Gaps — 3-5 gaps ranked by importance. Target jargon, assumptions, and logical leaps. For each gap, ask one clarifying question I should be able to answer.',
    '(3) Corrected mental model — the fixed explanation in one short paragraph, still in plain 12-year-old language.',
    hint ? `\nTopic hint: ${hint}` : '',
    '\n--- Lesson ---',
    context,
  ].join('\n');

const reframePrompt = (context: string, hint?: string) =>
  [
    'You are a Socratic coach. Student needs an alternative perspective on this topic. Reason step by step about the core concept before writing the output.',
    hint ? `\nReframe hint: ${hint}` : '',
    'Output: (1) alternative reframe of core concept, (2) strengths vs original framing, (3) where reframe breaks down. 3 sections.',
    '\n--- Lesson ---',
    context,
  ].join('\n');

const drillPrompt = (context: string, hint?: string) =>
  [
    'You are a quizmaster. Generate 5 practice questions for student studying this topic. Reason step by step about which concepts test best before writing the questions.',
    hint ? `\nTopic hint: ${hint}` : '',
    'Rules: mix recall (2), application (2), analysis (1). Format each exactly: Q: ... A: ... Explanation: ... Number 1-5.',
    '\n--- Lesson ---',
    context,
  ].join('\n');

export const askPrompt = (question: string, context: string) =>
  [
    'You are a helpful tutor. Answer the question based on the lesson content provided.',
    '',
    'Lesson content:',
    context,
    '',
    'Question:',
    question,
  ].join('\n');

/** Parses a pasted AI Drill response into importable questions. Tolerant of
 * numbering ("1.", "1)"), blank lines, and case; blocks missing Q or A are
 * counted as invalid. */
export interface DrillQuestion {
  question: string;
  answer: string;
  explanation: string;
}

export function parseDrillOutput(text: string): { questions: DrillQuestion[]; invalid: number } {
  const lines = text.split(/\r?\n/);
  const blocks: DrillQuestion[] = [];
  let invalid = 0;
  let cur: Partial<DrillQuestion> | null = null;
  const startBlock = () => {
    if (cur) {
      if (cur.question && cur.answer) {
        blocks.push({
          question: cur.question,
          answer: cur.answer,
          explanation: cur.explanation ?? '',
        });
      } else {
        invalid += 1;
      }
    }
  };
  for (const raw of lines) {
    const line = raw.replace(/^\s*\d+[.)]\s*/, '').trim();
    if (/^Q\s*[:.]/i.test(line)) {
      startBlock();
      cur = { question: line.replace(/^Q\s*[:.]\s*/i, '') };
    } else if (/^A\s*[:.]/i.test(line)) {
      if (cur) cur.answer = line.replace(/^A\s*[:.]\s*/i, '');
    } else if (/^Explanation\s*[:.]/i.test(line)) {
      if (cur) cur.explanation = line.replace(/^Explanation\s*[:.]\s*/i, '');
    } else if (line && cur) {
      // Continuation of the last field.
      if (cur.answer !== undefined && cur.question !== undefined && cur.explanation !== undefined) {
        cur.explanation += ` ${line}`;
      } else if (cur.answer !== undefined) {
        cur.answer += ` ${line}`;
      } else {
        cur.question += ` ${line}`;
      }
    }
  }
  startBlock();
  return { questions: blocks, invalid };
}

/** Render parsed drill questions as a cloze.yaml fragment. Each question
 * becomes a literal `{blank}` cloze — answer typed against the `answer` field. */
export function drillToYaml(questions: DrillQuestion[]): string {
  const esc = (v: string) => JSON.stringify(v);
  return questions
    .map((q, i) => {
      const lines = [
        `- id: "drill.${i + 1}"`,
        `  question: ${esc(`${q.question} {blank}`)}`,
        `  answer: ${esc(q.answer)}`,
      ];
      if (q.explanation) lines.push(`  explanation: ${esc(q.explanation)}`);
      return lines.join('\n');
    })
    .join('\n');
}

export const AI_SKILLS: AISkill[] = [
  {
    id: 'feynman',
    label: 'Feynman Explain',
    buildPrompt: feynmanPrompt,
  },
  {
    id: 'reframe',
    label: 'Reframe',
    buildPrompt: reframePrompt,
  },
  {
    id: 'drill',
    label: 'Drill',
    buildPrompt: drillPrompt,
  },
];
