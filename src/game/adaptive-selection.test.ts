import assert from "node:assert/strict";
import test from "node:test";
import type { GameState, Question } from "../domain/game.ts";
import { buildPlayerModelSnapshot } from "../domain/player-model.ts";
import { SEEDED_QUESTIONS } from "../seed/questions.ts";
import { selectNextAdaptiveQuestionId } from "./adaptive-selection.ts";
import { createInitialGameState, gameReducer } from "./game-state.ts";
import { getQuestionForState } from "./question-catalog.ts";

function createSignal(input: {
  questionId: string;
  category: string;
  result: "correct" | "incorrect" | "timeout";
  pressure?: boolean;
  responseTimeMs?: number;
  firstSelectionTimeMs?: number | null;
  selectionChangeCount?: number;
}) {
  return {
    questionId: input.questionId,
    questionRank: 1,
    category: input.category,
    result: input.result,
    correctAnswerIndex: 0,
    selectedAnswerIndex: input.result === "timeout" ? null : 0,
    lockedAnswerIndex: input.result === "timeout" ? null : 0,
    responseTimeMs: input.responseTimeMs ?? 6000,
    firstSelectionTimeMs: input.firstSelectionTimeMs ?? 2000,
    selectionChangeCount: input.selectionChangeCount ?? 0,
    timeRemainingAtLock: input.pressure ? 3 : 10,
    lockedWithUnder5s: input.pressure ?? false,
    timedOutWithoutLock: input.result === "timeout"
  } as const;
}

function createQuestion(input: Partial<Question> & Pick<Question, "id" | "category" | "difficultyBand" | "pressureTag">): Question {
  return {
    id: input.id,
    category: input.category,
    prompt: input.prompt ?? `Prompt for ${input.id}`,
    options: input.options ?? ["A", "B", "C", "D"],
    correctIndex: input.correctIndex ?? 0,
    difficultyBand: input.difficultyBand,
    pressureTag: input.pressureTag
  };
}

test("low-confidence fallback stays stable and close to baseline between questions", () => {
  let state = gameReducer(createInitialGameState(), {
    type: "START_RUN",
    firstQuestionId: SEEDED_QUESTIONS[0].id,
    questionCount: SEEDED_QUESTIONS.length
  });
  const currentQuestion = getQuestionForState(state, new Map(SEEDED_QUESTIONS.map((question) => [question.id, question])));

  state = gameReducer(state, { type: "SELECT_ANSWER", answerIndex: currentQuestion.correctIndex });
  state = gameReducer(state, { type: "LOCK_ANSWER" });
  state = gameReducer(state, { type: "RESOLVE_SUSPENSE", correctIndex: currentQuestion.correctIndex });

  const nextQuestionId = selectNextAdaptiveQuestionId({
    state,
    playerModel: null,
    questions: SEEDED_QUESTIONS
  });

  assert.equal(nextQuestionId, "q-03");
});

test("bounded adaptive selection avoids a hard jump after a recent timeout", () => {
  const model = buildPlayerModelSnapshot({
    runsObserved: 3,
    questionSignals: [
      createSignal({ questionId: "q-1", category: "Science", result: "correct" }),
      createSignal({ questionId: "q-2", category: "Science", result: "correct" }),
      createSignal({ questionId: "q-3", category: "History", result: "correct" }),
      createSignal({ questionId: "q-4", category: "History", result: "correct" }),
      createSignal({ questionId: "q-5", category: "Math", result: "correct", pressure: true }),
      createSignal({ questionId: "q-6", category: "Math", result: "incorrect", pressure: true })
    ]
  });

  const state: GameState = {
    ...createInitialGameState(),
    phase: "reveal",
    questionCount: SEEDED_QUESTIONS.length,
    questionIndex: 7,
    questionOrder: SEEDED_QUESTIONS.slice(0, 8).map((question) => question.id),
    answerLog: [
      { questionId: "q-06", result: "correct", selectedAnswer: 1, lockedAnswer: 1, timeRemaining: 8 },
      { questionId: "q-07", result: "timeout", selectedAnswer: null, lockedAnswer: null, timeRemaining: 0 },
      { questionId: "q-08", result: "correct", selectedAnswer: 2, lockedAnswer: 2, timeRemaining: 6 }
    ],
    lastRecord: { questionId: "q-08", result: "correct", selectedAnswer: 2, lockedAnswer: 2, timeRemaining: 6 },
    revealResult: "correct",
    selectedAnswer: 2,
    lockedAnswer: 2,
    timeRemaining: 6,
    outcome: null,
    failureReason: null,
    runNumber: 1
  };

  const nextQuestionId = selectNextAdaptiveQuestionId({
    state,
    playerModel: model,
    questions: SEEDED_QUESTIONS
  });

  assert.ok(nextQuestionId === "q-10" || nextQuestionId === "q-12");
  assert.notEqual(nextQuestionId, "q-09");
  assert.notEqual(nextQuestionId, "q-11");
});

test("recent incorrect answer does not trigger a punishment spiral into spiky recovery", () => {
  const model = buildPlayerModelSnapshot({
    runsObserved: 5,
    questionSignals: [
      createSignal({ questionId: "q-1", category: "Pattern Recall", result: "correct", pressure: true }),
      createSignal({ questionId: "q-2", category: "Language", result: "correct", pressure: true }),
      createSignal({ questionId: "q-3", category: "World Facts", result: "correct" }),
      createSignal({ questionId: "q-4", category: "Science", result: "correct" }),
      createSignal({ questionId: "q-5", category: "History", result: "correct", pressure: true }),
      createSignal({ questionId: "q-6", category: "Technology", result: "correct", pressure: true })
    ]
  });

  const state: GameState = {
    ...createInitialGameState(),
    phase: "reveal",
    questionCount: SEEDED_QUESTIONS.length,
    questionIndex: 7,
    questionOrder: SEEDED_QUESTIONS.slice(0, 8).map((question) => question.id),
    answerLog: [
      { questionId: "q-06", result: "correct", selectedAnswer: 1, lockedAnswer: 1, timeRemaining: 8 },
      { questionId: "q-07", result: "correct", selectedAnswer: 0, lockedAnswer: 0, timeRemaining: 7 },
      { questionId: "q-08", result: "incorrect", selectedAnswer: 1, lockedAnswer: 1, timeRemaining: 4 }
    ],
    lastRecord: { questionId: "q-08", result: "incorrect", selectedAnswer: 1, lockedAnswer: 1, timeRemaining: 4 },
    revealResult: "incorrect",
    selectedAnswer: 1,
    lockedAnswer: 1,
    timeRemaining: 4,
    outcome: "eliminated",
    failureReason: "wrong-answer",
    runNumber: 1
  };

  const nextQuestionId = selectNextAdaptiveQuestionId({
    state: {
      ...state,
      phase: "reveal",
      revealResult: "correct",
      outcome: null,
      failureReason: null
    },
    playerModel: model,
    questions: SEEDED_QUESTIONS
  });

  assert.notEqual(nextQuestionId, "q-09");
  assert.notEqual(nextQuestionId, "q-11");
});

test("recent-category hammering is avoided when a comparable alternative exists", () => {
  const model = buildPlayerModelSnapshot({
    runsObserved: 4,
    questionSignals: [
      createSignal({ questionId: "q-1", category: "Science", result: "incorrect" }),
      createSignal({ questionId: "q-2", category: "Science", result: "incorrect" }),
      createSignal({ questionId: "q-3", category: "Science", result: "correct" }),
      createSignal({ questionId: "q-4", category: "History", result: "correct" }),
      createSignal({ questionId: "q-5", category: "History", result: "correct" }),
      createSignal({ questionId: "q-6", category: "History", result: "correct" })
    ]
  });

  const questions = [
    createQuestion({ id: "alpha", category: "Science", difficultyBand: "medium", pressureTag: "neutral" }),
    createQuestion({ id: "beta", category: "Science", difficultyBand: "medium", pressureTag: "neutral" }),
    createQuestion({ id: "gamma", category: "Art", difficultyBand: "medium", pressureTag: "neutral" }),
    createQuestion({ id: "delta", category: "History", difficultyBand: "medium", pressureTag: "neutral" })
  ];

  const state: GameState = {
    ...createInitialGameState(),
    phase: "reveal",
    questionCount: questions.length,
    questionIndex: 1,
    questionOrder: ["alpha", "beta"],
    answerLog: [
      { questionId: "alpha", result: "correct", selectedAnswer: 0, lockedAnswer: 0, timeRemaining: 11 },
      { questionId: "beta", result: "correct", selectedAnswer: 0, lockedAnswer: 0, timeRemaining: 9 }
    ],
    lastRecord: { questionId: "beta", result: "correct", selectedAnswer: 0, lockedAnswer: 0, timeRemaining: 9 },
    revealResult: "correct",
    selectedAnswer: 0,
    lockedAnswer: 0,
    timeRemaining: 9,
    outcome: null,
    failureReason: null,
    runNumber: 1
  };

  const nextQuestionId = selectNextAdaptiveQuestionId({
    state,
    playerModel: model,
    questions
  });

  assert.notEqual(nextQuestionId, "alpha");
  assert.notEqual(nextQuestionId, "beta");
  assert.ok(nextQuestionId === "gamma" || nextQuestionId === "delta");
});

test("gameplay still completes normally through the adaptive question path", () => {
  const model = buildPlayerModelSnapshot({
    runsObserved: 5,
    questionSignals: [
      createSignal({ questionId: "q-1", category: "Pattern Recall", result: "correct" }),
      createSignal({ questionId: "q-2", category: "Language", result: "correct" }),
      createSignal({ questionId: "q-3", category: "World Facts", result: "correct" }),
      createSignal({ questionId: "q-4", category: "Science", result: "correct" }),
      createSignal({ questionId: "q-5", category: "Technology", result: "correct", pressure: true }),
      createSignal({ questionId: "q-6", category: "History", result: "correct", pressure: true })
    ]
  });

  let state = gameReducer(createInitialGameState(), {
    type: "START_RUN",
    firstQuestionId: SEEDED_QUESTIONS[0].id,
    questionCount: SEEDED_QUESTIONS.length
  });
  const askedQuestionIds = new Set<string>();
  const questionsById = new Map(SEEDED_QUESTIONS.map((question) => [question.id, question]));

  while (state.phase !== "result") {
    const currentQuestion = getQuestionForState(state, questionsById);
    askedQuestionIds.add(currentQuestion.id);

    state = gameReducer(state, {
      type: "SELECT_ANSWER",
      answerIndex: currentQuestion.correctIndex
    });
    state = gameReducer(state, { type: "LOCK_ANSWER" });
    state = gameReducer(state, { type: "RESOLVE_SUSPENSE", correctIndex: currentQuestion.correctIndex });

    const nextQuestionId =
      state.revealResult === "correct" && state.questionIndex < SEEDED_QUESTIONS.length - 1
        ? selectNextAdaptiveQuestionId({
            state,
            playerModel: model,
            questions: SEEDED_QUESTIONS
          }) ?? undefined
        : undefined;

    state = gameReducer(state, { type: "CONTINUE", nextQuestionId });
  }

  assert.equal(state.outcome, "completed");
  assert.equal(state.answerLog.length, SEEDED_QUESTIONS.length);
  assert.equal(askedQuestionIds.size, SEEDED_QUESTIONS.length);
});
