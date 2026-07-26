import { useEffect, useRef, useState } from 'react';

import { showToast } from '../toast';

export type FilterMode = 'all' | 'due' | 'starred';

interface CardReviewOpts<TCard> {
  fetchAll: () => Promise<TCard[]>;
  filterCards: (cards: TCard[], filter: FilterMode) => TCard[];
  reviewCard: (card: TCard, correct: boolean) => Promise<void>;
  toggleStar: (card: TCard) => Promise<TCard>;
  isStarred: (card: TCard) => boolean;
}

interface UseCardReviewStateReturn<TCard> {
  cards: TCard[];
  loading: boolean;
  currentIndex: number;
  showAnswer: boolean;
  filter: FilterMode;
  currentCard: TCard | undefined;
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

export function useCardReviewState<TCard>(
  opts: CardReviewOpts<TCard>,
): UseCardReviewStateReturn<TCard> {
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const [cards, setCards] = useState<TCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sessionReviewed, setSessionReviewed] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);

  const loadCards = (f: FilterMode) => {
    const { fetchAll, filterCards } = optsRef.current;
    setLoading(true);
    fetchAll()
      .then((all: TCard[]) => {
        const filtered = filterCards(all, f);
        setCards(filtered);
        setLoading(false);
        setCurrentIndex(0);
        setShowAnswer(false);
      })
      .catch(() => {
        showToast.error('toast.loadFailed');
        setLoading(false);
      });
  };

  useEffect(() => {
    const { fetchAll, filterCards } = optsRef.current;
    setLoading(true);
    fetchAll()
      .then((all: TCard[]) => {
        const filtered = filterCards(all, 'due');
        setCards(filtered);
        setLoading(false);
        setCurrentIndex(0);
        setShowAnswer(false);
      })
      .catch(() => {
        showToast.error('toast.loadFailed');
        setLoading(false);
      });
  }, []);

  const handleReview = async (correct: boolean) => {
    const card = cards[currentIndex];
    if (!card) return;
    await optsRef.current.reviewCard(card, correct);
    setSessionReviewed((r) => r + 1);
    if (correct) setSessionCorrect((c) => c + 1);
    setShowAnswer(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      loadCards(filter);
    }
  };

  const handleToggleStar = async () => {
    const card = cards[currentIndex];
    if (!card) return;
    const updated = await optsRef.current.toggleStar(card);
    setCards((prev) => prev.map((c) => (c === card ? updated : c)));
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setShowAnswer(false);
    }
  };

  const goNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
      setShowAnswer(false);
    }
  };

  const currentCard = cards[currentIndex];

  const accuracy = sessionReviewed > 0 ? sessionCorrect / sessionReviewed : 0;

  return {
    cards,
    loading,
    currentIndex,
    showAnswer,
    filter,
    currentCard,
    sessionReviewed,
    sessionCorrect,
    accuracy,
    setShowAnswer,
    setFilter: (f: FilterMode) => {
      setFilter(f);
      loadCards(f);
    },
    handleReview,
    handleToggleStar,
    goPrev,
    goNext,
    reload: () => loadCards(filter),
  };
}
