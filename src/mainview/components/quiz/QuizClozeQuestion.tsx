import { useEffect, useRef } from 'react';

import { clozeScore, parseClozeText } from '../../quizUtil';
import { useQuizStore } from '../../stores/quizStore';

interface QuizClozeQuestionProps {
  question: string;
  type?: string;
}

export default function QuizClozeQuestion({ question, type }: QuizClozeQuestionProps) {
  if (type !== 'cloze') {
    return <>{question}</>;
  }
  return <ClozeBlankInputs question={question} />;
}

/** Inline per-blank inputs rendered inside the question text. Each blank maps
 * to its own input; Enter advances, Enter on the last blank submits. */
function ClozeBlankInputs({ question }: { question: string }) {
  const segments = parseClozeText(question).segments;
  const currentQuestion = useQuizStore((s) => s.currentQuestion);
  const hasAnswer = useQuizStore((s) => s.hasAnswer);
  const textInput = useQuizStore((s) => s.textInput);
  const clozeAttempts = useQuizStore((s) => s.clozeAttempts);
  const selectedAnswers = useQuizStore((s) => s.selectedAnswers);
  const blankInputs = useQuizStore((s) => s.clozeBlankInputs);
  const setClozeBlankInput = useQuizStore((s) => s.setClozeBlankInput);
  const submitCloze = useQuizStore((s) => s.submitCloze);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const blankPositions = segments
    .map((seg, i) => (seg.type === 'blank' ? i : -1))
    .filter((i) => i >= 0);

  // Per-blank correctness: resolved answers after resolve, attempt-1 submission
  // while waiting for the retry.
  let wrongFlags: boolean[] = [];
  if (currentQuestion) {
    if (hasAnswer) {
      wrongFlags = clozeScore(currentQuestion, selectedAnswers[currentQuestion.id]).results;
    } else if ((clozeAttempts[currentQuestion.id] ?? 0) >= 1) {
      wrongFlags = clozeScore(currentQuestion, textInput).results;
    }
  }
  const allOk = wrongFlags.length > 0 && wrongFlags.every(Boolean);
  const flagFor = (blankIdx: number): boolean | undefined => {
    if (wrongFlags.length === 0) return undefined;
    if (wrongFlags.length === blankPositions.length) return wrongFlags[blankIdx];
    // `{blank}`-directive fallback: single whole-string result applies to all inputs.
    return allOk;
  };

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <span key={i}>{seg.value}</span>;
        }
        const blankIdx = blankPositions.indexOf(i);
        const value = blankInputs[blankIdx] ?? '';
        const flag = flagFor(blankIdx);
        const stateCls =
          flag === undefined
            ? 'border-indigo-400/70'
            : flag
              ? 'border-emerald-400/80'
              : hasAnswer
                ? 'border-red-400/80'
                : 'border-amber-400/80';
        const width = seg.value ? `${Math.max(seg.value.length, 4)}ch` : '10ch';
        return (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[blankIdx] = el;
            }}
            type="text"
            value={value}
            disabled={hasAnswer}
            onChange={(e) => setClozeBlankInput(blankIdx, e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              if (blankIdx < blankPositions.length - 1) {
                inputRefs.current[blankIdx + 1]?.focus();
              } else {
                submitCloze();
              }
            }}
            style={{ width }}
            aria-label={`Blank ${blankIdx + 1}`}
            className={`inline-block bg-gray-800/40 border-b-2 border-dashed mx-1 align-baseline px-2 py-0.5 text-[inherit] font-[inherit] rounded-t-md focus:outline-none focus:border-indigo-400 disabled:opacity-70 ${stateCls}`}
          />
        );
      })}
    </>
  );
}
