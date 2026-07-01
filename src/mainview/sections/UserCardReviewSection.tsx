import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { UserCard } from '../../bun/types';
import { api } from '../api';
import FilterBar from '../components/userCards/FilterBar';
import ReviewCardDisplay from '../components/userCards/ReviewCardDisplay';
import type { FilterMode } from '../hooks/useCardReviewState';
import { useCardReviewState } from '../hooks/useCardReviewState';

interface Props {
  courseId: string;
}

export default function UserCardReviewSection({ courseId }: Props) {
  const { t } = useTranslation();

  const fetchAll = useCallback(() => api.usercards.list(courseId), [courseId]);

  const filterCards = useCallback((cards: UserCard[], filter: FilterMode) => {
    if (filter === 'due') return cards.filter((c) => new Date(c.nextReviewDate) <= new Date());
    if (filter === 'starred') return cards.filter((c) => c.isStarred);
    return cards;
  }, []);

  const reviewCard = useCallback(async (card: UserCard, correct: boolean) => {
    await api.usercards.review(card.id, correct);
  }, []);

  const toggleStar = useCallback(async (card: UserCard) => {
    return (await api.usercards.toggleStar(card.id)) ?? card;
  }, []);

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
  } = useCardReviewState<UserCard>({
    fetchAll,
    filterCards,
    reviewCard,
    toggleStar,
    isStarred: useCallback((c: UserCard) => c.isStarred, []),
  });

  if (loading)
    return <div className="p-8 text-center text-gray-400">{t('review.loadingCards')}</div>;

  return (
    <div className="max-w-xl mx-auto">
      <FilterBar filter={filter} onFilter={setFilter} />
      {cards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">
            {filter === 'due'
              ? t('review.noDueCards')
              : filter === 'starred'
                ? t('review.noStarredCards')
                : t('userCardReview.noCards')}
          </p>
          <p className="text-sm text-gray-500">{t('userCardReview.noCardsHint')}</p>
        </div>
      ) : (
        currentCard && (
          <ReviewCardDisplay
            card={currentCard}
            currentIndex={currentIndex}
            totalCards={cards.length}
            showAnswer={showAnswer}
            onShowAnswer={() => setShowAnswer(true)}
            onReview={handleReview}
            onToggleStar={handleToggleStar}
          />
        )
      )}
    </div>
  );
}
