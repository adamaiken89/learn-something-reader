import { describe, expect, test, afterEach } from "bun:test";
import { render, waitFor } from "@testing-library/react";
import QuizView from "../../mainview/components/QuizView";
import { mockFetch, restoreFetch } from "./mock-fetch";

const mockQuestions = [
  {
    id: "q1",
    question: "What is 2+2?",
    options: { A: "3", B: "4", C: "5" },
    answer: "B",
    explanation: "Basic addition",
    difficulty: 1,
    tags: ["math"],
  },
  {
    id: "q2",
    question: "What color is sky?",
    options: { A: "Red", B: "Green", C: "Blue" },
    answer: "C",
    explanation: "Light scattering",
    difficulty: 1,
    tags: ["science"],
  },
];

const defaultProps = {
  subjectId: "test",
  moduleId: 1,
  onBack: () => {},
};

afterEach(restoreFetch);

describe("QuizView snapshots", () => {
  test("loading state", () => {
    mockFetch({ "/quiz/start": mockQuestions });
    const { container } = render(<QuizView {...defaultProps} />);
    expect(container.innerHTML).toMatchSnapshot();
  });

  test("empty quiz (no questions)", async () => {
    mockFetch({ "/quiz/start": [] });
    const { container } = render(<QuizView {...defaultProps} />);
    await waitFor(() =>
      expect(container.textContent).toContain("No quiz questions")
    );
    expect(container.innerHTML).toMatchSnapshot();
  });

  test("first question displayed", async () => {
    mockFetch({ "/quiz/start": mockQuestions });
    const { container } = render(<QuizView {...defaultProps} />);
    await waitFor(() =>
      expect(container.textContent).toContain("What is 2+2?")
    );
    expect(container.innerHTML).toMatchSnapshot();
  });
});
