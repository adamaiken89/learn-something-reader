import { parseClozeText } from '../../quizUtil';

interface QuizClozeQuestionProps {
  question: string;
  type?: string;
}

export default function QuizClozeQuestion({ question, type }: QuizClozeQuestionProps) {
  if (type !== 'cloze') {
    return <>{question}</>;
  }

  const { segments } = parseClozeText(question);
  return (
    <>
      {segments.map((seg, i) =>
        seg.type === 'blank' ? (
          <span
            key={i}
            className="inline-block min-w-[3.5rem] border-b-2 border-dashed border-indigo-400/70 mx-1 align-baseline"
          >
            &nbsp;
          </span>
        ) : (
          <span key={i}>{seg.value}</span>
        ),
      )}
    </>
  );
}
