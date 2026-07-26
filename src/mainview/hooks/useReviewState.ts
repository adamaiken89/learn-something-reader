import { useState } from 'react';

import type { SRSCard, SRSDeck } from '../../bun/types';
import { api } from '../api';
import type { FilterMode } from './useCardReviewState';
import { useCardReviewState } from './useCardReviewState';

interface UseReviewStateReturn {
  cards: SRSCard[];
  loading: boolean;
  currentIndex: number;
  showAnswer: boolean;
  filter: FilterMode;
  deck: SRSDeck;
  currentCard: SRSCard | undefined;
  sessionReviewed: number;
  sessionCorrect: number;
  accuracy: number;
  setShowAnswer: (v: boolean) => void;
  setFilter: (f: FilterMode) => void;
  handleReview: (correct: boolean) => Promise<void>;
  handleToggleStar: () => Promise<void>;
  goPrev: () => void;
  goNext: () => void;
  reload: () => void;
}

export function useReviewState(courseId: string): UseReviewStateReturn {
  const [deck, setDeck] = useState<SRSDeck>({ cards: {} });

  const fetchAll = async () => {
    const d = await api.courses.srs.get(courseId);
    setDeck(d);
    return Object.values(d.cards);
  };

  const filterCards = (cards: SRSCard[], filter: FilterMode) => {
    if (filter === 'due') return cards.filter((c) => new Date(c.nextReviewDate) <= new Date());
    if (filter === 'starred') return cards.filter((c) => c.isStarred);
    return cards;
  };

  const reviewCard = async (card: SRSCard, correct: boolean) => {
    const result = await api.courses.srs.review(courseId, card.id, correct, deck);
    setDeck((d) => ({ ...d, cards: { ...d.cards, [card.id]: result } }));
  };

  const toggleStar = async (card: SRSCard) => {
    await api.courses.srs.toggleStar(courseId, card.id);
    return { ...card, isStarred: !card.isStarred };
  };

  const state = useCardReviewState<SRSCard>({
    fetchAll,
    filterCards,
    reviewCard,
    toggleStar,
    isStarred: (c: SRSCard) => c.isStarred,
  });

  return {
    ...state,
    deck,
  };
}
