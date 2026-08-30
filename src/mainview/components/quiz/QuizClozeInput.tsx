import { AlertTriangle, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { clozeAnswers, clozeCorrect, clozeScore, parseClozeText } from '../../quizUtil';
import { useQuizStore } from '../../stores/quizStore';

export default function QuizClozeInput() {
  const { t } = useTranslation();
  const currentQuestion = useQuizStore((s) => s.currentQuestion);
  const hasAnswer = useQuizStore((s) => s.hasAnswer);
  const clozeAttempts = useQuizStore((s) => s.clozeAttempts);
  const selectedAnswers = useQuizStore((s) => s.selectedAnswers);
  const blankInputs = useQuizStore((s) => s.clozeBlankInputs);
  const submitCloze = useQuizStore((s) => s.submitCloze);

  if (!currentQuestion || currentQuestion.type !== 'cloze') return null;

  const attempt = clozeAttempts[currentQuestion.id] ?? 0;
  const submitted = hasAnswer ? (selectedAnswers[currentQuestion.id] ?? '') : '';
  const isCorrect = hasAnswer && clozeCorrect(currentQuestion, submitted);
  const canRetry = !hasAnswer && attempt >= 1;
  const canSubmit =
    !hasAnswer && blankInputs.length > 0 && blankInputs.every((v) => v.trim() !== '');

  const blankCount = parseClozeText(currentQuestion.question).segments.filter(
    (s) => s.type === 'blank',
  ).length;
  const answers = clozeAnswers(currentQuestion);
  const resolvedResults = hasAnswer ? clozeScore(currentQuestion, submitted).results : [];
  const perBlankFeedback = answers.length === blankCount && resolvedResults.length === blankCount;

  return (
    <div className="mb-5">
      {!hasAnswer && (
        <button
          onClick={submitCloze}
          disabled={!canSubmit}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-[10px] text-sm font-medium transition-colors disabled:opacity-50"
        >
          {t('quiz.clozeCheck')}
        </button>
      )}
      {canRetry && (
        <p className="mt-3 text-amber-400 text-sm flex items-center gap-1.5">
          <AlertTriangle size={14} />
          {t('quiz.clozeTryAgain')}
        </p>
      )}
      {hasAnswer && (
        <div className="mt-3">
          {isCorrect ? (
            <p className="text-emerald-400 text-sm flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full border-2 border-emerald-400 bg-emerald-500/20 flex items-center justify-center">
                <Check size={12} />
              </span>
              {t('quiz.correctLabel', 'Correct')}
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {perBlankFeedback ? (
                answers.map(
                  (ans, i) =>
                    !resolvedResults[i] && (
                      <p key={i} className="text-red-400 text-sm flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full border-2 border-red-400 bg-red-500/20 flex items-center justify-center shrink-0">
                          <X size={12} />
                        </span>
                        {t('quiz.clozeBlankIncorrect', { index: i + 1, answer: ans })}
                      </p>
                    ),
                )
              ) : (
                <p className="text-red-400 text-sm flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full border-2 border-red-400 bg-red-500/20 flex items-center justify-center">
                    <X size={12} />
                  </span>
                  {t('quiz.clozeWrongAnswer', { user: submitted, answer: currentQuestion.answer })}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
