import test from "node:test";
import assert from "node:assert/strict";

import type { ContentQuestion } from "./content.ts";
import {
  buildAdminIntelligenceReport,
  deriveAdaptationFairnessReview,
  deriveDropoffRankReviews,
  deriveQuestionCalibrationReviews
} from "./admin-intelligence.ts";
import type {
  PersistedPlayerModel,
  PersistedQuestionBehaviorSignal,
  PersistedRun
} from "./persistence.ts";

function createQuestion(overrides: Partial<ContentQuestion> & Pick<ContentQuestion, "id" | "category">): ContentQuestion {
  return {
    id: overrides.id,
    externalKey: overrides.externalKey ?? overrides.id,
    prompt: overrides.prompt ?? `${overrides.id} prompt`,
    options: overrides.options ?? ["A", "B", "C", "D"],
    correctIndex: overrides.correctIndex ?? 0,
    category: overrides.category,
    difficultyBand: overrides.difficultyBand ?? "medium",
    pressureTag: overrides.pressureTag ?? "neutral",
    questionSetVersion: overrides.questionSetVersion ?? "launch-v1",
    sourceLabel: overrides.sourceLabel ?? "curated-launch"
  };
}

function createRun(overrides: Partial<PersistedRun> & Pick<PersistedRun, "id" | "userId" | "completedAt" | "outcome">): PersistedRun {
  return {
    id: overrides.id,
    userId: overrides.userId,
    createdAt: overrides.createdAt ?? overrides.completedAt,
    startedAt: overrides.startedAt ?? overrides.completedAt,
    completedAt: overrides.completedAt,
    outcome: overrides.outcome,
    highestRank: overrides.highestRank ?? 0,
    correctAnswers: overrides.correctAnswers ?? 0,
    totalQuestions: overrides.totalQuestions ?? 12,
    failureReason: overrides.failureReason ?? (overrides.outcome === "eliminated" ? "wrong-answer" : null),
    bestReserveSeconds: overrides.bestReserveSeconds ?? null,
    questionSetVersion: overrides.questionSetVersion ?? "launch-v1",
    avgResponseTimeMs: overrides.avgResponseTimeMs ?? null,
    avgFirstSelectionTimeMs: overrides.avgFirstSelectionTimeMs ?? null,
    selectionChangeRate: overrides.selectionChangeRate ?? null,
    pressureMissCount: overrides.pressureMissCount ?? 0,
    timeoutCount: overrides.timeoutCount ?? 0,
    categorySummary: overrides.categorySummary ?? null
  };
}

function createSignal(
  overrides: Partial<PersistedQuestionBehaviorSignal> & {
    id: string;
    runId: string;
    userId: string;
    questionId: string;
    questionRank: number;
    category: string;
  }
): PersistedQuestionBehaviorSignal {
  return {
    id: overrides.id,
    runId: overrides.runId,
    userId: overrides.userId,
    questionId: overrides.questionId,
    questionRank: overrides.questionRank,
    category: overrides.category,
    result: overrides.result ?? "correct",
    correctAnswerIndex: overrides.correctAnswerIndex ?? 0,
    selectedAnswerIndex: overrides.selectedAnswerIndex ?? 0,
    lockedAnswerIndex: overrides.lockedAnswerIndex ?? 0,
    responseTimeMs: overrides.responseTimeMs ?? 8_000,
    firstSelectionTimeMs: overrides.firstSelectionTimeMs ?? 3_000,
    selectionChangeCount: overrides.selectionChangeCount ?? 0,
    timeRemainingAtLock: overrides.timeRemainingAtLock ?? 9,
    lockedWithUnder5s: overrides.lockedWithUnder5s ?? false,
    timedOutWithoutLock: overrides.timedOutWithoutLock ?? false,
    createdAt: overrides.createdAt ?? "2026-05-27T00:00:00.000Z"
  };
}

test("deriveQuestionCalibrationReviews flags unstable questions and keeps sparse observations low-confidence", () => {
  const questions = [
    createQuestion({
      id: "q-stable",
      category: "Science",
      difficultyBand: "easy",
      pressureTag: "calm"
    }),
    createQuestion({
      id: "q-unstable",
      category: "History",
      difficultyBand: "hard",
      pressureTag: "spiky"
    })
  ];

  const signals = [
    createSignal({ id: "s1", runId: "run-1", userId: "user-1", questionId: "q-stable", questionRank: 1, category: "Science" }),
    createSignal({ id: "s2", runId: "run-2", userId: "user-1", questionId: "q-stable", questionRank: 1, category: "Science" }),
    createSignal({ id: "s3", runId: "run-1", userId: "user-1", questionId: "q-unstable", questionRank: 7, category: "History", result: "incorrect", responseTimeMs: 16_000, selectionChangeCount: 2, lockedWithUnder5s: true }),
    createSignal({ id: "s4", runId: "run-2", userId: "user-2", questionId: "q-unstable", questionRank: 7, category: "History", result: "timeout", responseTimeMs: 19_000, selectedAnswerIndex: null, lockedAnswerIndex: null, firstSelectionTimeMs: null, selectionChangeCount: 1, timedOutWithoutLock: true }),
    createSignal({ id: "s5", runId: "run-3", userId: "user-3", questionId: "q-unstable", questionRank: 7, category: "History", result: "incorrect", responseTimeMs: 17_500, selectionChangeCount: 2, lockedWithUnder5s: true }),
    createSignal({ id: "s6", runId: "run-4", userId: "user-4", questionId: "q-unstable", questionRank: 7, category: "History", result: "correct", responseTimeMs: 15_000, selectionChangeCount: 1, lockedWithUnder5s: true })
  ];

  const reviews = deriveQuestionCalibrationReviews({
    questionSignals: signals,
    questions
  });

  assert.equal(reviews[0]?.questionId, "q-unstable");
  assert.equal(reviews[0]?.status, "review");
  assert.deepEqual(reviews[0]?.flags, [
    "elevated-miss-rate",
    "high-selection-churn",
    "late-lock-instability",
    "slow-response-anomaly"
  ]);
  assert.equal(reviews[1]?.questionId, "q-stable");
  assert.equal(reviews[1]?.status, "low-confidence");
});

test("deriveQuestionCalibrationReviews tolerates missing question metadata for older signals", () => {
  const reviews = deriveQuestionCalibrationReviews({
    questionSignals: [
      createSignal({
        id: "legacy-1",
        runId: "legacy-run",
        userId: "legacy-user",
        questionId: "seeded-q-1",
        questionRank: 3,
        category: "Math",
        result: "incorrect"
      }),
      createSignal({
        id: "legacy-2",
        runId: "legacy-run-2",
        userId: "legacy-user",
        questionId: "seeded-q-1",
        questionRank: 3,
        category: "Math",
        result: "correct"
      })
    ],
    questions: []
  });

  assert.equal(reviews[0]?.externalKey, null);
  assert.equal(reviews[0]?.difficultyBand, null);
  assert.equal(reviews[0]?.status, "low-confidence");
});

test("deriveDropoffRankReviews identifies an end-of-run hotspot", () => {
  const runs = [
    createRun({ id: "run-1", userId: "u1", completedAt: "2026-05-27T00:00:00.000Z", outcome: "eliminated" }),
    createRun({ id: "run-2", userId: "u2", completedAt: "2026-05-27T00:01:00.000Z", outcome: "eliminated" }),
    createRun({ id: "run-3", userId: "u3", completedAt: "2026-05-27T00:02:00.000Z", outcome: "eliminated" }),
    createRun({ id: "run-4", userId: "u4", completedAt: "2026-05-27T00:03:00.000Z", outcome: "eliminated" }),
    createRun({ id: "run-5", userId: "u5", completedAt: "2026-05-27T00:04:00.000Z", outcome: "completed", highestRank: 12, correctAnswers: 12, failureReason: null })
  ];

  const signals = [
    createSignal({ id: "r1-q5", runId: "run-1", userId: "u1", questionId: "q1", questionRank: 5, category: "History", result: "incorrect" }),
    createSignal({ id: "r2-q5", runId: "run-2", userId: "u2", questionId: "q1", questionRank: 5, category: "History", result: "timeout", selectedAnswerIndex: null, lockedAnswerIndex: null, timedOutWithoutLock: true }),
    createSignal({ id: "r3-q5", runId: "run-3", userId: "u3", questionId: "q1", questionRank: 5, category: "History", result: "incorrect" }),
    createSignal({ id: "r4-q2", runId: "run-4", userId: "u4", questionId: "q2", questionRank: 2, category: "Science", result: "incorrect" }),
    createSignal({ id: "r5-q12", runId: "run-5", userId: "u5", questionId: "q3", questionRank: 12, category: "Art", result: "correct" })
  ];

  const reviews = deriveDropoffRankReviews({
    runs,
    questionSignals: signals
  });

  assert.equal(reviews[0]?.rank, 5);
  assert.equal(reviews[0]?.endings, 3);
  assert.equal(reviews[0]?.status, "review");
  assert.equal(reviews[0]?.dominantCategory, "History");
});

test("deriveAdaptationFairnessReview flags harsh rebounds and repeated categories after misses", () => {
  const questions = [
    createQuestion({ id: "q1", category: "Science", difficultyBand: "easy", pressureTag: "calm" }),
    createQuestion({ id: "q2", category: "Science", difficultyBand: "hard", pressureTag: "spiky" }),
    createQuestion({ id: "q3", category: "History", difficultyBand: "medium", pressureTag: "neutral" }),
    createQuestion({ id: "q4", category: "Math", difficultyBand: "hard", pressureTag: "spiky" }),
    createQuestion({ id: "q5", category: "Math", difficultyBand: "easy", pressureTag: "calm" }),
    createQuestion({ id: "q6", category: "Geography", difficultyBand: "medium", pressureTag: "neutral" }),
    createQuestion({ id: "q7", category: "Art", difficultyBand: "hard", pressureTag: "spiky" }),
    createQuestion({ id: "q8", category: "Art", difficultyBand: "easy", pressureTag: "calm" })
  ];

  const signals = [
    createSignal({ id: "run-1-q1", runId: "run-1", userId: "u1", questionId: "q1", questionRank: 1, category: "Science", result: "incorrect" }),
    createSignal({ id: "run-1-q2", runId: "run-1", userId: "u1", questionId: "q2", questionRank: 2, category: "Science", result: "correct" }),
    createSignal({ id: "run-1-q3", runId: "run-1", userId: "u1", questionId: "q3", questionRank: 3, category: "History", result: "correct" }),
    createSignal({ id: "run-1-q4", runId: "run-1", userId: "u1", questionId: "q6", questionRank: 4, category: "Geography", result: "correct" }),
    createSignal({ id: "run-2-q1", runId: "run-2", userId: "u2", questionId: "q5", questionRank: 1, category: "Math", result: "timeout", selectedAnswerIndex: null, lockedAnswerIndex: null, timedOutWithoutLock: true }),
    createSignal({ id: "run-2-q2", runId: "run-2", userId: "u2", questionId: "q4", questionRank: 2, category: "Math", result: "correct" }),
    createSignal({ id: "run-2-q3", runId: "run-2", userId: "u2", questionId: "q3", questionRank: 3, category: "History", result: "correct" }),
    createSignal({ id: "run-2-q4", runId: "run-2", userId: "u2", questionId: "q7", questionRank: 4, category: "Art", result: "incorrect" }),
    createSignal({ id: "run-2-q5", runId: "run-2", userId: "u2", questionId: "q8", questionRank: 5, category: "Art", result: "correct" })
  ];

  const review = deriveAdaptationFairnessReview({
    questionSignals: signals,
    questions
  });

  assert.equal(review.transitionsObserved, 7);
  assert.equal(review.harshPressureRebounds, 2);
  assert.equal(review.timeoutPressureRebounds, 1);
  assert.equal(review.repeatedCategoryRebounds, 3);
  assert.equal(review.difficultyLeaps, 3);
  assert.equal(review.status, "review");
  assert.deepEqual(review.notes, [
    "spiky-after-miss",
    "spiky-after-timeout",
    "repeated-category-rebound",
    "difficulty-leap"
  ]);
});

test("buildAdminIntelligenceReport assembles a compact backstage review payload", () => {
  const questions = [
    createQuestion({ id: "q1", category: "Science", difficultyBand: "easy", pressureTag: "calm" }),
    createQuestion({ id: "q2", category: "History", difficultyBand: "medium", pressureTag: "neutral" }),
    createQuestion({ id: "q3", category: "Math", difficultyBand: "hard", pressureTag: "spiky" })
  ];
  const runs = [
    createRun({ id: "run-1", userId: "u1", completedAt: "2026-05-27T00:00:00.000Z", outcome: "eliminated" }),
    createRun({ id: "run-2", userId: "u2", completedAt: "2026-05-27T00:01:00.000Z", outcome: "completed", highestRank: 12, correctAnswers: 12, failureReason: null })
  ];
  const questionSignals = [
    createSignal({ id: "run-1-q1", runId: "run-1", userId: "u1", questionId: "q1", questionRank: 1, category: "Science", result: "correct" }),
    createSignal({ id: "run-1-q2", runId: "run-1", userId: "u1", questionId: "q2", questionRank: 2, category: "History", result: "incorrect" }),
    createSignal({ id: "run-2-q1", runId: "run-2", userId: "u2", questionId: "q1", questionRank: 1, category: "Science", result: "correct" }),
    createSignal({ id: "run-2-q2", runId: "run-2", userId: "u2", questionId: "q2", questionRank: 2, category: "History", result: "correct" }),
    createSignal({ id: "run-2-q3", runId: "run-2", userId: "u2", questionId: "q3", questionRank: 3, category: "Math", result: "correct" })
  ];
  const playerModels: PersistedPlayerModel[] = [
    {
      userId: "u2",
      createdAt: "2026-05-27T00:00:00.000Z",
      updatedAt: "2026-05-27T00:01:00.000Z",
      runsObserved: 2,
      questionsObserved: 15,
      accuracyRate: 0.7,
      timeoutRate: 0.1,
      avgResponseTimeMs: 8_000,
      avgFirstSelectionTimeMs: 3_000,
      avgSelectionChangeCount: 0.2,
      pressureAccuracyRate: 0.5,
      pressureTimeoutRate: 0.1,
      confidenceStyle: "measured",
      hesitationStyle: "deliberate-reader",
      pressureStyle: "pressure-sensitive",
      categorySnapshot: {},
      modelVersion: "player-model-v1"
    }
  ];

  const report = buildAdminIntelligenceReport({
    runs,
    questionSignals,
    questions,
    playerModels
  });

  assert.equal(report.summary.runsObserved, 2);
  assert.equal(report.summary.eliminatedRunsObserved, 1);
  assert.equal(report.summary.questionSignalsObserved, 5);
  assert.equal(report.summary.playerModelsObserved, 1);
  assert.equal(report.questionReviews.length, 3);
  assert.ok(report.dropoffRanks.length >= 1);
});


test("question review thresholds stay conservative for miss-only or sparse evidence", () => {
  const questions = [
    createQuestion({ id: "q-watch", category: "Geography", difficultyBand: "medium", pressureTag: "neutral" }),
    createQuestion({ id: "q-sparse", category: "Art", difficultyBand: "hard", pressureTag: "spiky" })
  ];

  const signals = [
    createSignal({ id: "w1", runId: "run-w1", userId: "user-1", questionId: "q-watch", questionRank: 6, category: "Geography", result: "incorrect" }),
    createSignal({ id: "w2", runId: "run-w2", userId: "user-2", questionId: "q-watch", questionRank: 6, category: "Geography", result: "incorrect" }),
    createSignal({ id: "w3", runId: "run-w3", userId: "user-3", questionId: "q-watch", questionRank: 6, category: "Geography", result: "correct" }),
    createSignal({ id: "w4", runId: "run-w4", userId: "user-4", questionId: "q-watch", questionRank: 6, category: "Geography", result: "incorrect" }),
    createSignal({ id: "s1", runId: "run-s1", userId: "user-5", questionId: "q-sparse", questionRank: 9, category: "Art", result: "timeout", selectedAnswerIndex: null, lockedAnswerIndex: null, firstSelectionTimeMs: null, timedOutWithoutLock: true }),
    createSignal({ id: "s2", runId: "run-s2", userId: "user-6", questionId: "q-sparse", questionRank: 9, category: "Art", result: "incorrect" }),
    createSignal({ id: "s3", runId: "run-s3", userId: "user-7", questionId: "q-sparse", questionRank: 9, category: "Art", result: "timeout", selectedAnswerIndex: null, lockedAnswerIndex: null, firstSelectionTimeMs: null, timedOutWithoutLock: true })
  ];

  const reviews = deriveQuestionCalibrationReviews({ questionSignals: signals, questions });
  const watchReview = reviews.find((review) => review.questionId === "q-watch");
  const sparseReview = reviews.find((review) => review.questionId === "q-sparse");

  assert.equal(watchReview?.status, "watch");
  assert.deepEqual(watchReview?.flags, ["elevated-miss-rate"]);
  assert.equal(sparseReview?.status, "low-confidence");
});

test("dropoff and adaptation thresholds prefer low-confidence or watch before review", () => {
  const runs = [
    createRun({ id: "run-1", userId: "u1", completedAt: "2026-05-27T00:00:00.000Z", outcome: "eliminated" }),
    createRun({ id: "run-2", userId: "u2", completedAt: "2026-05-27T00:01:00.000Z", outcome: "eliminated" }),
    createRun({ id: "run-3", userId: "u3", completedAt: "2026-05-27T00:02:00.000Z", outcome: "eliminated" }),
    createRun({ id: "run-4", userId: "u4", completedAt: "2026-05-27T00:03:00.000Z", outcome: "eliminated" })
  ];
  const dropoffSignals = [
    createSignal({ id: "d1", runId: "run-1", userId: "u1", questionId: "q1", questionRank: 4, category: "Science", result: "incorrect" }),
    createSignal({ id: "d2", runId: "run-2", userId: "u2", questionId: "q1", questionRank: 4, category: "Science", result: "incorrect" }),
    createSignal({ id: "d3", runId: "run-3", userId: "u3", questionId: "q2", questionRank: 2, category: "History", result: "incorrect" }),
    createSignal({ id: "d4", runId: "run-4", userId: "u4", questionId: "q3", questionRank: 1, category: "Math", result: "incorrect" })
  ];
  const dropoffReview = deriveDropoffRankReviews({ runs, questionSignals: dropoffSignals }).find((review) => review.rank == 4);

  assert.equal(dropoffReview?.status, "watch");

  const questions = [
    createQuestion({ id: "a1", category: "Science", difficultyBand: "easy", pressureTag: "calm" }),
    createQuestion({ id: "a2", category: "History", difficultyBand: "medium", pressureTag: "spiky" }),
    createQuestion({ id: "a3", category: "Math", difficultyBand: "medium", pressureTag: "neutral" }),
    createQuestion({ id: "a4", category: "Music", difficultyBand: "medium", pressureTag: "neutral" }),
    createQuestion({ id: "a5", category: "Science", difficultyBand: "medium", pressureTag: "neutral" }),
    createQuestion({ id: "a6", category: "Art", difficultyBand: "medium", pressureTag: "neutral" }),
    createQuestion({ id: "a7", category: "Geography", difficultyBand: "medium", pressureTag: "neutral" })
  ];
  const adaptationSignals = [
    createSignal({ id: "a1-1", runId: "run-a1", userId: "ua1", questionId: "a1", questionRank: 1, category: "Science", result: "incorrect" }),
    createSignal({ id: "a1-2", runId: "run-a1", userId: "ua1", questionId: "a2", questionRank: 2, category: "History", result: "correct" }),
    createSignal({ id: "a1-3", runId: "run-a1", userId: "ua1", questionId: "a3", questionRank: 3, category: "Math", result: "correct" }),
    createSignal({ id: "a2-1", runId: "run-a2", userId: "ua2", questionId: "a4", questionRank: 1, category: "Music", result: "incorrect" }),
    createSignal({ id: "a2-2", runId: "run-a2", userId: "ua2", questionId: "a5", questionRank: 2, category: "Science", result: "correct" }),
    createSignal({ id: "a2-3", runId: "run-a2", userId: "ua2", questionId: "a6", questionRank: 3, category: "Art", result: "correct" }),
    createSignal({ id: "a3-1", runId: "run-a3", userId: "ua3", questionId: "a1", questionRank: 1, category: "Science", result: "correct" }),
    createSignal({ id: "a3-2", runId: "run-a3", userId: "ua3", questionId: "a7", questionRank: 2, category: "Geography", result: "correct" })
  ];
  const adaptationReview = deriveAdaptationFairnessReview({ questionSignals: adaptationSignals, questions });

  assert.equal(adaptationReview.transitionsObserved, 5);
  assert.equal(adaptationReview.status, "low-confidence");
});
