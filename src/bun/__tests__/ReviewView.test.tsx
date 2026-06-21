import { describe, expect, test, afterEach } from "bun:test";
import { render, waitFor } from "@testing-library/react";
import ReviewView from "../../mainview/components/ReviewView";
import { mockFetch, restoreFetch } from "./mock-fetch";

const mockCard = {
  id: "test-1-q1",
  questionId: "q1",
  moduleId: 1,
  subjectId: "test",
  question: "What is 2+2?",
  answer: "B. 4",
  explanation: "Basic addition",
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
  nextReviewDate: "2024-01-01T00:00:00.000Z",
  lastReviewed: null,
  isStarred: false,
};

const mockDeck = { cards: { "test-1-q1": mockCard } };

const defaultProps = { subjectId: "test", onBack: () => {} };

afterEach(restoreFetch);

describe("ReviewView snapshots", () => {
  test("loading state", () => {
    mockFetch({ "/srs": mockDeck });
    const { container } = render(<ReviewView {...defaultProps} />);
    expect(container.innerHTML).toMatchSnapshot();
  });

  test("empty deck (no cards)", async () => {
    mockFetch({ "/srs": { cards: {} } });
    const { container } = render(<ReviewView {...defaultProps} />);
    await waitFor(() =>
      expect(container.textContent).toContain("No cards in deck")
    );
    expect(container.innerHTML).toMatchSnapshot();
  });

  test("card question side (initial)", async () => {
    mockFetch({ "/srs": mockDeck, "/filter": [mockCard] });
    const { container } = render(<ReviewView {...defaultProps} />);
    await waitFor(() =>
      expect(container.textContent).toContain("Show Answer")
    );
    expect(container.innerHTML).toMatchSnapshot();
  });
});
