import { describe, expect, test } from "bun:test";
import { QuizEngine } from "../quiz-engine";
import type { QuizQuestion } from "../types";

function makeQ(id: string, answer: string): QuizQuestion {
  return {
    id,
    question: `Question ${id}?`,
    options: { A: "Opt A", B: "Opt B", C: "Opt C" },
    answer,
    explanation: `Explanation ${id}`,
    difficulty: 1,
    tags: [],
  };
}

describe("QuizEngine", () => {
  describe("load", () => {
    test("loads questions and resets state", () => {
      const engine = new QuizEngine();
      const qs = [makeQ("q1", "A"), makeQ("q2", "B")];
      engine.load(qs);
      expect(engine.questions).toHaveLength(2);
      expect(engine.currentIndex).toBe(0);
      expect(engine.selectedAnswers).toEqual({});
      expect(engine.isCompleted).toBe(false);
    });
  });

  describe("currentQuestion", () => {
    test("returns question at current index", () => {
      const engine = new QuizEngine();
      engine.load([makeQ("q1", "A"), makeQ("q2", "B")]);
      expect(engine.currentQuestion!.id).toBe("q1");
    });

    test("returns null when no questions", () => {
      const engine = new QuizEngine();
      expect(engine.currentQuestion).toBeNull();
    });
  });

  describe("selectAnswer", () => {
    test("records selected answer", () => {
      const engine = new QuizEngine();
      engine.load([makeQ("q1", "A")]);
      engine.selectAnswer("B");
      expect(engine.selectedAnswers["q1"]).toBe("B");
    });

    test("does nothing when no current question", () => {
      const engine = new QuizEngine();
      engine.selectAnswer("A");
      expect(engine.selectedAnswers).toEqual({});
    });
  });

  describe("nextQuestion", () => {
    test("advances to next question", () => {
      const engine = new QuizEngine();
      engine.load([makeQ("q1", "A"), makeQ("q2", "B")]);
      engine.nextQuestion();
      expect(engine.currentIndex).toBe(1);
      expect(engine.currentQuestion!.id).toBe("q2");
    });

    test("sets isCompleted on last question, index stays at last", () => {
      const engine = new QuizEngine();
      engine.load([makeQ("q1", "A")]);
      engine.nextQuestion();
      expect(engine.isCompleted).toBe(true);
      expect(engine.currentIndex).toBe(0);
    });

    test("stays at last index after completion (idempotent)", () => {
      const engine = new QuizEngine();
      engine.load([makeQ("q1", "A")]);
      engine.nextQuestion();
      engine.nextQuestion();
      expect(engine.isCompleted).toBe(true);
      expect(engine.currentIndex).toBe(0);
    });
  });

  describe("isCorrect", () => {
    test("returns true for correct answer", () => {
      const engine = new QuizEngine();
      engine.load([makeQ("q1", "A")]);
      engine.selectAnswer("A");
      expect(engine.isCorrect("q1")).toBe(true);
    });

    test("returns false for wrong answer", () => {
      const engine = new QuizEngine();
      engine.load([makeQ("q1", "A")]);
      engine.selectAnswer("B");
      expect(engine.isCorrect("q1")).toBe(false);
    });

    test("returns null for unanswered question", () => {
      const engine = new QuizEngine();
      engine.load([makeQ("q1", "A")]);
      expect(engine.isCorrect("q1")).toBeNull();
    });

    test("returns null for nonexistent question", () => {
      const engine = new QuizEngine();
      expect(engine.isCorrect("no-such")).toBeNull();
    });
  });

  describe("score", () => {
    test("returns correct/total count", () => {
      const engine = new QuizEngine();
      engine.load([makeQ("q1", "A"), makeQ("q2", "B"), makeQ("q3", "C")]);
      engine.selectAnswer("A");
      engine.nextQuestion();
      engine.selectAnswer("B");
      engine.nextQuestion();
      engine.selectAnswer("X");
      const { correct, total } = engine.score;
      expect(correct).toBe(2);
      expect(total).toBe(3);
    });

    test("returns 0/0 when no questions", () => {
      const engine = new QuizEngine();
      expect(engine.score).toEqual({ correct: 0, total: 0 });
    });
  });

  describe("percentage", () => {
    test("calculates percentage correctly", () => {
      const engine = new QuizEngine();
      engine.load([makeQ("q1", "A"), makeQ("q2", "B"), makeQ("q3", "C"), makeQ("q4", "A")]);
      engine.selectAnswer("A");
      engine.nextQuestion();
      engine.selectAnswer("B");
      engine.nextQuestion();
      engine.selectAnswer("C");
      engine.nextQuestion();
      engine.selectAnswer("X");
      expect(engine.percentage).toBe(75);
    });

    test("returns 0 when no questions", () => {
      const engine = new QuizEngine();
      expect(engine.percentage).toBe(0);
    });
  });

  describe("reset", () => {
    test("clears all state", () => {
      const engine = new QuizEngine();
      engine.load([makeQ("q1", "A")]);
      engine.selectAnswer("A");
      engine.nextQuestion();
      engine.reset();
      expect(engine.questions).toEqual([]);
      expect(engine.currentIndex).toBe(0);
      expect(engine.selectedAnswers).toEqual({});
      expect(engine.isCompleted).toBe(false);
    });
  });
});
