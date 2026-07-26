export type AISkillId = 'feynman' | 'reframe' | 'drill';

export interface AISkill {
  id: AISkillId;
  label: string;
  buildPrompt(context: string, hint?: string, userExplanation?: string): string;
}

const feynmanPrompt = (context: string, hint?: string, userExplanation?: string) =>
  [
    userExplanation ? `${userExplanation}\n` : '',
    'You are a curious 12-year-old. Read my explanation above and the lesson below. Ask 3-5 clarifying questions to expose gaps in my understanding. Target jargon, assumptions, and logical leaps.',
    hint ? `\nTopic hint: ${hint}` : '',
    '\n--- Lesson ---',
    context,
  ].join('\n');

const reframePrompt = (context: string, hint?: string) =>
  [
    'You are a Socratic coach. Student needs an alternative perspective on this topic.',
    hint ? `\nReframe hint: ${hint}` : '',
    'Output: (1) alternative reframe of core concept, (2) strengths vs original framing, (3) where reframe breaks down. 3 sections.',
    '\n--- Lesson ---',
    context,
  ].join('\n');

const drillPrompt = (context: string, hint?: string) =>
  [
    'You are a quizmaster. Generate 5 practice questions for student studying this topic.',
    hint ? `\nTopic hint: ${hint}` : '',
    'Rules: mix recall (2), application (2), analysis (1). Each: Q: ... A: ... Explanation: ... Number 1-5.',
    '\n--- Lesson ---',
    context,
  ].join('\n');

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
