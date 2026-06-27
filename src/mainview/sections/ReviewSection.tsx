import { useTranslation } from 'react-i18next';

import { filterVariants } from '../components/ui';
import { useReviewState } from '../hooks/useReviewState';

interface Props {
  courseId: string;
}

export default function ReviewSection({ courseId }: Props) {
  const { t } = useTranslation();
  const {
    cards,
    loading,
    currentIndex,
    showAnswer,
    filter,
    currentCard,
    setShowAnswer,
    setFilter,
    handleReview,
    handleToggleStar,
  } = useReviewState(courseId);

  if (loading)
    return <div className="p-8 text-center text-gray-400">{t('review.loadingCards')}</div>;

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-center gap-2 mb-6">
        {(['all', 'due', 'starred'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={filterVariants({ active: filter === f })}
          >
            {f === 'all' ? t('review.all') : f === 'due' ? t('review.due') : t('review.starred')}
          </button>
        ))}
      </div>
      {cards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">
            {filter === 'due'
              ? t('review.noDueCards')
              : filter === 'starred'
                ? t('review.noStarredCards')
                : t('review.noCards')}
          </p>
          <p className="text-sm text-gray-500">{t('review.completeQuiz')}</p>
        </div>
      ) : (
        currentCard && (
          <div>
            <div className="text-xs text-gray-500 mb-2 text-center">
              {t('review.cardOf', { current: currentIndex + 1, total: cards.length })}
              {currentCard.isStarred && (
                <span className="ml-2 text-yellow-500">{t('icons.starFilled')}</span>
              )}
            </div>

            <div className="bg-gray-800 rounded-xl p-8 min-h-[200px] flex flex-col items-center justify-center text-center mb-6">
              {!showAnswer ? (
                <div>
                  <h3 className="text-lg font-medium mb-6">{currentCard.question}</h3>
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                  >
                    {t('review.showAnswer')}
                  </button>
                </div>
              ) : (
                <div className="w-full">
                  <div className="mb-4 pb-4 border-b border-gray-700">
                    <p className="text-sm text-gray-400 mb-1">{t('review.question')}</p>
                    <p className="text-lg font-medium">{currentCard.question}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-1">{t('review.answer')}</p>
                    <p className="text-lg">{currentCard.answer}</p>
                  </div>
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-1">{t('review.explanation')}</p>
                    <p className="text-sm text-gray-300">{currentCard.explanation}</p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => {
                        void handleReview(false);
                      }}
                      className="px-6 py-2 bg-red-700 hover:bg-red-600 rounded-lg transition-colors"
                    >
                      {t('review.forgot')}
                    </button>
                    <button
                      onClick={() => {
                        void handleReview(true);
                      }}
                      className="px-6 py-2 bg-emerald-700 hover:bg-emerald-600 rounded-lg transition-colors"
                    >
                      {t('review.remembered')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-2">
              {currentCard.isStarred ? (
                <button
                  onClick={() => {
                    void handleToggleStar();
                  }}
                  className="text-xs text-yellow-500 hover:text-yellow-400"
                >
                  {t('review.unstar')}
                </button>
              ) : (
                <button
                  onClick={() => {
                    void handleToggleStar();
                  }}
                  className="text-xs text-gray-500 hover:text-gray-400"
                >
                  {t('review.star')}
                </button>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
