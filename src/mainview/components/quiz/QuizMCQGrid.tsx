import { Check, X } from 'lucide-react';

import { useQuizStore } from '../../stores/quizStore';
import { optionButtonClass, radioIndicatorClass } from '../ui/variants/quiz';

interface Props {
  highlightedIdx?: number;
}

export default function QuizMCQGrid({ highlightedIdx = -1 }: Props = {}) {
  const currentQuestion = useQuizStore((s) => s.currentQuestion);
  const selectedAnswers = useQuizStore((s) => s.selectedAnswers);
  const hasAnswer = useQuizStore((s) => s.hasAnswer);
  const selectAnswer = useQuizStore((s) => s.selectAnswer);

  if (!currentQuestion || currentQuestion.type === 'cloze') return null;

  const options = Object.entries(currentQuestion.options || {});

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
      {options.map(([key, value], idx) => {
        const isSelected = selectedAnswers[currentQuestion.id] === key;
        const isHighlighted = idx === highlightedIdx && !hasAnswer;
        const showCorrect = hasAnswer && key === currentQuestion.answer;
        const showWrong = hasAnswer && isSelected && key !== currentQuestion.answer;

        return (
          <button
            key={key}
            onClick={() => !hasAnswer && selectAnswer(key)}
            disabled={hasAnswer}
            data-highlighted={isHighlighted || undefined}
            className={optionButtonClass({
              showCorrect,
              showWrong,
              isSelected,
              isHighlighted,
              hasAnswer,
            })}
          >
            <span
              className={radioIndicatorClass({ showCorrect, showWrong, isSelected, isHighlighted })}
            >
              {showCorrect && <Check size={12} />}
              {showWrong && <X size={12} />}
            </span>
            <span className="text-gray-400">{key}.</span>
            <span>{String(value)}</span>
          </button>
        );
      })}
    </div>
  );
}
