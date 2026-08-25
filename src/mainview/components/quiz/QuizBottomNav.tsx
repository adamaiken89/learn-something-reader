import { CornerDownLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { quizCtaButton, quizNavButton } from '@/lib/quiz-styles';

import { useQuizStore } from '../../stores/quizStore';

export default function QuizBottomNav() {
  const { t } = useTranslation();
  const currentIndex = useQuizStore((s) => s.currentIndex);
  const questions = useQuizStore((s) => s.questions);
  const hasAnswer = useQuizStore((s) => s.hasAnswer);
  const skipQuestion = useQuizStore((s) => s.skipQuestion);
  const nextQuestion = useQuizStore((s) => s.nextQuestion);

  return (
    <div className="flex justify-between items-center">
      <button onClick={skipQuestion} className={quizNavButton()}>
        {t('quiz.skip')} <span className="text-[10px] text-gray-600 ml-0.5">[Esc]</span>
      </button>
      <button onClick={nextQuestion} disabled={!hasAnswer} className={quizCtaButton()}>
        {currentIndex < questions.length - 1 ? t('quiz.nextQuestion') : t('quiz.finishQuiz')}{' '}
        <span className="text-[10px] opacity-60 ml-1 inline-flex items-center">
          <CornerDownLeft size={10} />
        </span>
      </button>
    </div>
  );
}
