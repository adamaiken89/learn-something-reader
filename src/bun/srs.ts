import type { SRSCard, SRSDeck } from "./types";

export function getDueCards(deck: SRSDeck, now?: Date): SRSCard[] {
  const nowDate = now || new Date();
  return Object.values(deck.cards)
    .filter((c) => new Date(c.nextReviewDate) <= nowDate)
    .sort((a, b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime());
}

export function getStarredCards(deck: SRSDeck): SRSCard[] {
  return Object.values(deck.cards)
    .filter((c) => c.isStarred)
    .sort((a, b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime());
}

export function getAllCards(deck: SRSDeck): SRSCard[] {
  return Object.values(deck.cards).sort(
    (a, b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime()
  );
}

export function getCardsForSubject(deck: SRSDeck, subjectId: string): SRSCard[] {
  return getAllCards(deck).filter((c) => c.subjectId === subjectId);
}

export function getDueCardsForSubject(deck: SRSDeck, subjectId: string, now?: Date): SRSCard[] {
  return getDueCards(deck, now).filter((c) => c.subjectId === subjectId);
}

export function getStarredCardsForSubject(deck: SRSDeck, subjectId: string): SRSCard[] {
  return getStarredCards(deck).filter((c) => c.subjectId === subjectId);
}

export function toggleStar(deck: SRSDeck, cardId: string): SRSDeck {
  const card = deck.cards[cardId];
  if (!card) return deck;
  return {
    ...deck,
    cards: {
      ...deck.cards,
      [cardId]: { ...card, isStarred: !card.isStarred },
    },
  };
}
