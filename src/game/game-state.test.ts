import test from "node:test";
import assert from "node:assert/strict";
import { SEEDED_QUESTIONS } from "../seed/questions.ts";
import { createInitialGameState, gameReducer, QUESTION_TIME_LIMIT } from "./game-state.ts";
import { getFallbackNextQuestionId } from "./question-catalog.ts";

test("start run enters the first active question", () => {
  const state = gameReducer(createInitialGameState(), {
    type: "START_RUN",
    firstQuestionId: SEEDED_QUESTIONS[0].id,
    questionCount: SEEDED_QUESTIONS.length
  });

  assert.equal(state.phase, "active");
  assert.equal(state.questionCount, SEEDED_QUESTIONS.length);
  assert.equal(state.questionIndex, 0);
  assert.equal(state.timeRemaining, QUESTION_TIME_LIMIT);
  assert.equal(state.selectedAnswer, null);
});

test("correct lock flows through suspense and advances to the next question", () => {
  let state = gameReducer(createInitialGameState(), {
    type: "START_RUN",
    firstQuestionId: SEEDED_QUESTIONS[0].id,
    questionCount: SEEDED_QUESTIONS.length
  });
  state = gameReducer(state, { type: "SELECT_ANSWER", answerIndex: SEEDED_QUESTIONS[0].correctIndex });
  state = gameReducer(state, { type: "LOCK_ANSWER" });

  assert.equal(state.phase, "suspense");
  assert.equal(state.lockedAnswer, SEEDED_QUESTIONS[0].correctIndex);

  state = gameReducer(state, { type: "RESOLVE_SUSPENSE", correctIndex: SEEDED_QUESTIONS[0].correctIndex });
  assert.equal(state.phase, "reveal");
  assert.equal(state.revealResult, "correct");
  assert.equal(state.answerLog.length, 1);

  state = gameReducer(state, {
    type: "CONTINUE",
    nextQuestionId: getFallbackNextQuestionId(state.questionOrder, SEEDED_QUESTIONS) ?? undefined
  });
  assert.equal(state.phase, "active");
  assert.equal(state.questionIndex, 1);
  assert.equal(state.timeRemaining, QUESTION_TIME_LIMIT);
});

test("wrong answer reveal transitions cleanly into result", () => {
  let state = gameReducer(createInitialGameState(), {
    type: "START_RUN",
    firstQuestionId: SEEDED_QUESTIONS[0].id,
    questionCount: SEEDED_QUESTIONS.length
  });
  const wrongIndex = SEEDED_QUESTIONS[0].correctIndex === 0 ? 1 : 0;

  state = gameReducer(state, { type: "SELECT_ANSWER", answerIndex: wrongIndex });
  state = gameReducer(state, { type: "LOCK_ANSWER" });
  state = gameReducer(state, { type: "RESOLVE_SUSPENSE", correctIndex: SEEDED_QUESTIONS[0].correctIndex });

  assert.equal(state.phase, "reveal");
  assert.equal(state.revealResult, "incorrect");
  assert.equal(state.outcome, "eliminated");

  state = gameReducer(state, { type: "CONTINUE" });
  assert.equal(state.phase, "result");
  assert.equal(state.failureReason, "wrong-answer");
});

test("timer expiry produces an elimination reveal without suspense", () => {
  let state = gameReducer(createInitialGameState(), {
    type: "START_RUN",
    firstQuestionId: SEEDED_QUESTIONS[0].id,
    questionCount: SEEDED_QUESTIONS.length
  });

  for (let step = 0; step < QUESTION_TIME_LIMIT; step += 1) {
    state = gameReducer(state, { type: "TICK" });
  }

  assert.equal(state.phase, "reveal");
  assert.equal(state.revealResult, "incorrect");
  assert.equal(state.failureReason, "timeout");
  assert.equal(state.timeRemaining, 0);

  state = gameReducer(state, { type: "CONTINUE" });
  assert.equal(state.phase, "result");
  assert.equal(state.outcome, "eliminated");
});

test("final correct reveal transitions cleanly into a completed result", () => {
  let state = gameReducer(createInitialGameState(), {
    type: "START_RUN",
    firstQuestionId: SEEDED_QUESTIONS[0].id,
    questionCount: SEEDED_QUESTIONS.length
  });

  for (let questionIndex = 0; questionIndex < SEEDED_QUESTIONS.length; questionIndex += 1) {
    state = gameReducer(state, {
      type: "SELECT_ANSWER",
      answerIndex: SEEDED_QUESTIONS[questionIndex].correctIndex
    });
    state = gameReducer(state, { type: "LOCK_ANSWER" });
    state = gameReducer(state, { type: "RESOLVE_SUSPENSE", correctIndex: SEEDED_QUESTIONS[questionIndex].correctIndex });

    assert.equal(state.phase, "reveal");
    assert.equal(state.revealResult, "correct");

    state = gameReducer(state, {
      type: "CONTINUE",
      nextQuestionId:
        questionIndex < SEEDED_QUESTIONS.length - 1
          ? (getFallbackNextQuestionId(state.questionOrder, SEEDED_QUESTIONS) ?? undefined)
          : undefined
    });
  }

  assert.equal(state.phase, "result");
  assert.equal(state.outcome, "completed");
  assert.equal(state.answerLog.length, SEEDED_QUESTIONS.length);
});
