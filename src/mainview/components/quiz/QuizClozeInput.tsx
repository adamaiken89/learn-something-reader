import { AlertTriangle, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { clozeCorrect } from '../../quizUtil';
import { useQuizStore } from '../../stores/quizStore';

export default function QuizClozeInput() {
  const { t } = useTranslation();
  const currentQuestion = useQuizStore((s) => s.currentQuestion);
  const textInput = useQuizStore((s) => s.textInput);
  const hasAnswer = useQuizStore((s) => s.hasAnswer);
  const selectAnswer = useQuizStore((s) => s.selectAnswer);
  const setTextInput = useQuizStore((s) => s.setTextInput);
  const clozeAttempts = useQuizStore((s) => s.clozeAttempts);

  if (!currentQuestion || currentQuestion.type !== 'cloze') return null;

  const attempt = clozeAttempts[currentQuestion.id] ?? 0;
  const isCorrect = hasAnswer && clozeCorrect(currentQuestion, textInput);
  const canRetry = !hasAnswer && attempt >= 1;

  return (
    <div className="mb-5">
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && textInput.trim() && !hasAnswer) {
              selectAnswer(textInput.trim());
            }
          }}
          placeholder={t('quiz.clozePlaceholder')}
          disabled={hasAnswer}
          className="flex-1 bg-gray-800/50 border-2 border-gray-600/40 rounded-[10px] px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 disabled:opacity-50 text-[15px] font-medium"
        />
        {!hasAnswer && (
          <button
            onClick={() => textInput.trim() && selectAnswer(textInput.trim())}
            disabled={!textInput.trim()}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-[10px] text-sm font-medium transition-colors disabled:opacity-50"
          >
            {t('quiz.clozeCheck')}
          </button>
        )}
      </div>
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
              {t('quiz.correct')}
            </p>
          ) : (
            <p className="text-red-400 text-sm flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full border-2 border-red-400 bg-red-500/20 flex items-center justify-center">
                <X size={12} />
              </span>
              {t('quiz.clozeWrongAnswer', { user: textInput, answer: currentQuestion.answer })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
