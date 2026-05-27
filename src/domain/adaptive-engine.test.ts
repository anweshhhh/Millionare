import assert from "node:assert/strict";
import test from "node:test";
import type { Question } from "./game.ts";
import { buildPlayerModelSnapshot } from "./player-model.ts";
import { chooseAdaptiveQuestion, isLowConfidenceAdaptationModel } from "./adaptive-engine.ts";

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

test("low-confidence fallback stays boring and freshness-first", () => {
  const result = chooseAdaptiveQuestion({
    playerModel: null,
    runContext: {
      currentRank: 6,
      recentResults: [],
      recentCategories: ["Science"],
      recentlySeenQuestionIds: ["q-a"]
    },
    candidates: [
      createQuestion({ id: "q-a", category: "Science", difficultyBand: "medium", pressureTag: "neutral" }),
      createQuestion({ id: "q-b", category: "History", difficultyBand: "medium", pressureTag: "neutral" }),
      createQuestion({ id: "q-c", category: "Art", difficultyBand: "medium", pressureTag: "spiky" })
    ]
  });

  assert.equal(result.lowConfidenceFallback, true);
  assert.equal(result.targetDifficultyBand, "medium");
  assert.equal(result.chosenQuestionId, "q-b");
});

test("bounded difficulty move stabilizes after a timeout instead of jumping harder", () => {
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

  const result = chooseAdaptiveQuestion({
    playerModel: model,
    runContext: {
      currentRank: 9,
      recentResults: ["correct", "timeout"],
      recentCategories: [],
      recentlySeenQuestionIds: []
    },
    candidates: [
      createQuestion({ id: "q-easy", category: "Science", difficultyBand: "medium", pressureTag: "calm" }),
      createQuestion({ id: "q-hard", category: "History", difficultyBand: "hard", pressureTag: "neutral" })
    ]
  });

  assert.equal(result.targetDifficultyBand, "medium");
  assert.equal(result.chosenQuestionId, "q-easy");
});

test("timeout-prone guardrail filters spiky candidates", () => {
  const timeoutProneModel = buildPlayerModelSnapshot({
    runsObserved: 4,
    questionSignals: [
      createSignal({ questionId: "q-1", category: "Science", result: "timeout", pressure: true, firstSelectionTimeMs: null }),
      createSignal({ questionId: "q-2", category: "Science", result: "timeout", pressure: true, firstSelectionTimeMs: null }),
      createSignal({ questionId: "q-3", category: "History", result: "timeout", pressure: true, firstSelectionTimeMs: null }),
      createSignal({ questionId: "q-4", category: "History", result: "incorrect", pressure: true }),
      createSignal({ questionId: "q-5", category: "Math", result: "incorrect", pressure: true }),
      createSignal({ questionId: "q-6", category: "Math", result: "incorrect", pressure: true })
    ]
  });

  assert.equal(isLowConfidenceAdaptationModel(timeoutProneModel), false);
  assert.equal(timeoutProneModel.pressureStyle, "timeout-prone");

  const result = chooseAdaptiveQuestion({
    playerModel: timeoutProneModel,
    runContext: {
      currentRank: 7,
      recentResults: ["timeout"],
      recentCategories: [],
      recentlySeenQuestionIds: []
    },
    candidates: [
      createQuestion({ id: "q-calm", category: "Art", difficultyBand: "medium", pressureTag: "calm" }),
      createQuestion({ id: "q-spiky", category: "Geography", difficultyBand: "medium", pressureTag: "spiky" })
    ]
  });

  assert.equal(result.chosenQuestionId, "q-calm");
  assert.ok(result.rankedCandidates.every((candidate) => candidate.questionId !== "q-spiky"));
});

test("weak-spot targeting is restrained when the weak category was just seen", () => {
  const model = buildPlayerModelSnapshot({
    runsObserved: 5,
    questionSignals: [
      createSignal({ questionId: "q-1", category: "Science", result: "incorrect" }),
      createSignal({ questionId: "q-2", category: "Science", result: "incorrect" }),
      createSignal({ questionId: "q-3", category: "Science", result: "correct" }),
      createSignal({ questionId: "q-4", category: "History", result: "correct" }),
      createSignal({ questionId: "q-5", category: "History", result: "correct" }),
      createSignal({ questionId: "q-6", category: "History", result: "correct" })
    ]
  });

  const result = chooseAdaptiveQuestion({
    playerModel: model,
    runContext: {
      currentRank: 5,
      recentResults: ["correct"],
      recentCategories: ["Science"],
      recentlySeenQuestionIds: []
    },
    candidates: [
      createQuestion({ id: "q-science", category: "Science", difficultyBand: "medium", pressureTag: "neutral" }),
      createQuestion({ id: "q-art", category: "Art", difficultyBand: "medium", pressureTag: "neutral" })
    ]
  });

  assert.equal(result.chosenQuestionId, "q-art");
});

test("freshness tie-break picks the less recently seen candidate deterministically", () => {
  const model = buildPlayerModelSnapshot({
    runsObserved: 2,
    questionSignals: [
      createSignal({ questionId: "q-1", category: "Science", result: "correct" }),
      createSignal({ questionId: "q-2", category: "Science", result: "correct" }),
      createSignal({ questionId: "q-3", category: "History", result: "correct" }),
      createSignal({ questionId: "q-4", category: "History", result: "correct" }),
      createSignal({ questionId: "q-5", category: "Math", result: "correct", pressure: true }),
      createSignal({ questionId: "q-6", category: "Math", result: "correct", pressure: true })
    ]
  });

  const result = chooseAdaptiveQuestion({
    playerModel: model,
    runContext: {
      currentRank: 6,
      recentResults: ["correct"],
      recentCategories: [],
      recentlySeenQuestionIds: ["q-repeat"]
    },
    candidates: [
      createQuestion({ id: "q-repeat", category: "Art", difficultyBand: "medium", pressureTag: "neutral" }),
      createQuestion({ id: "q-fresh", category: "Art", difficultyBand: "medium", pressureTag: "neutral" })
    ]
  });

  assert.equal(result.chosenQuestionId, "q-fresh");
});

test("insufficient-data model falls back close to baseline even if style labels are thin", () => {
  const thinModel = buildPlayerModelSnapshot({
    runsObserved: 1,
    questionSignals: [
      createSignal({ questionId: "q-1", category: "Science", result: "correct" }),
      createSignal({ questionId: "q-2", category: "History", result: "incorrect" }),
      createSignal({ questionId: "q-3", category: "Math", result: "correct" })
    ]
  });

  assert.equal(isLowConfidenceAdaptationModel(thinModel), true);

  const result = chooseAdaptiveQuestion({
    playerModel: thinModel,
    runContext: {
      currentRank: 9,
      recentResults: ["correct"],
      recentCategories: [],
      recentlySeenQuestionIds: []
    },
    candidates: [
      createQuestion({ id: "q-medium", category: "Art", difficultyBand: "medium", pressureTag: "neutral" }),
      createQuestion({ id: "q-hard", category: "Science", difficultyBand: "hard", pressureTag: "spiky" })
    ]
  });

  assert.equal(result.lowConfidenceFallback, true);
  assert.equal(result.targetDifficultyBand, "hard");
  assert.equal(result.chosenQuestionId, "q-hard");
});

test("wrong-answer recovery avoids pairing the rebound with spiky pressure", () => {
  const model = buildPlayerModelSnapshot({
    runsObserved: 5,
    questionSignals: [
      createSignal({ questionId: "q-1", category: "Science", result: "correct", pressure: true }),
      createSignal({ questionId: "q-2", category: "Science", result: "correct", pressure: true }),
      createSignal({ questionId: "q-3", category: "History", result: "correct" }),
      createSignal({ questionId: "q-4", category: "History", result: "correct" }),
      createSignal({ questionId: "q-5", category: "Math", result: "correct", pressure: true }),
      createSignal({ questionId: "q-6", category: "Math", result: "correct", pressure: true })
    ]
  });

  const result = chooseAdaptiveQuestion({
    playerModel: model,
    runContext: {
      currentRank: 9,
      recentResults: ["correct", "incorrect"],
      recentCategories: [],
      recentlySeenQuestionIds: []
    },
    candidates: [
      createQuestion({ id: "q-calm", category: "Art", difficultyBand: "medium", pressureTag: "neutral" }),
      createQuestion({ id: "q-spiky", category: "Geography", difficultyBand: "medium", pressureTag: "spiky" })
    ]
  });

  assert.equal(result.targetDifficultyBand, "medium");
  assert.equal(result.chosenQuestionId, "q-calm");
  assert.ok(result.rankedCandidates.every((candidate) => candidate.questionId !== "q-spiky"));
});

test("fallback freshness ordering still rotates away from repeated categories when guardrails empty the scored set", () => {
  const result = chooseAdaptiveQuestion({
    playerModel: null,
    runContext: {
      currentRank: 6,
      recentResults: [],
      recentCategories: ["Science", "Science", "Science"],
      recentlySeenQuestionIds: []
    },
    candidates: [
      createQuestion({ id: "q-science", category: "Science", difficultyBand: "medium", pressureTag: "neutral" }),
      createQuestion({ id: "q-history", category: "History", difficultyBand: "hard", pressureTag: "neutral" })
    ]
  });

  assert.equal(result.chosenQuestionId, "q-history");
});
