import assert from "node:assert/strict";
import test from "node:test";
import {
  PLAYER_MODEL_THRESHOLDS,
  buildPlayerModelSnapshot,
  buildRunBehaviorSummary,
  createTransientQuestionCapture,
  finalizeQuestionBehaviorSignal,
  recordLock,
  recordSelection
} from "./player-model.ts";

test("first selection timing and selection changes are tracked deterministically", () => {
  let capture = createTransientQuestionCapture({
    questionId: "q-01",
    questionRank: 1,
    category: "Science",
    activatedAtMs: 1_000
  });

  capture = recordSelection(capture, {
    answerIndex: 2,
    selectedAtMs: 2_200
  });

  capture = recordSelection(capture, {
    answerIndex: 3,
    selectedAtMs: 4_000
  });

  capture = recordSelection(capture, {
    answerIndex: 3,
    selectedAtMs: 4_400
  });

  capture = recordLock(capture, {
    lockedAnswerIndex: 3,
    lockedAtMs: 6_500,
    timeRemainingAtLock: 4
  });

  const signal = finalizeQuestionBehaviorSignal(capture, {
    result: "incorrect",
    correctAnswerIndex: 1,
    selectedAnswerIndex: 3,
    lockedAnswerIndex: 3,
    resolvedAtMs: 8_000
  });

  assert.equal(signal.firstSelectionTimeMs, 1_200);
  assert.equal(signal.selectionChangeCount, 1);
  assert.equal(signal.responseTimeMs, 5_500);
  assert.equal(signal.lockedWithUnder5s, true);
  assert.equal(signal.timedOutWithoutLock, false);
});

test("timeout finalization keeps first-selection null when no answer was chosen", () => {
  const capture = createTransientQuestionCapture({
    questionId: "q-02",
    questionRank: 2,
    category: "Math",
    activatedAtMs: 10_000
  });

  const signal = finalizeQuestionBehaviorSignal(capture, {
    result: "timeout",
    correctAnswerIndex: 0,
    selectedAnswerIndex: null,
    lockedAnswerIndex: null,
    resolvedAtMs: 30_000
  });

  assert.equal(signal.responseTimeMs, 20_000);
  assert.equal(signal.firstSelectionTimeMs, null);
  assert.equal(signal.timedOutWithoutLock, true);
  assert.equal(signal.lockedAnswerIndex, null);
  assert.equal(signal.timeRemainingAtLock, null);
});

test("run behavior summary aggregates counts, averages, pressure misses, and categories", () => {
  const summary = buildRunBehaviorSummary([
    {
      questionId: "q-01",
      questionRank: 1,
      category: "Science",
      result: "correct",
      correctAnswerIndex: 1,
      selectedAnswerIndex: 1,
      lockedAnswerIndex: 1,
      responseTimeMs: 6_000,
      firstSelectionTimeMs: 2_000,
      selectionChangeCount: 0,
      timeRemainingAtLock: 14,
      lockedWithUnder5s: false,
      timedOutWithoutLock: false
    },
    {
      questionId: "q-02",
      questionRank: 2,
      category: "Science",
      result: "incorrect",
      correctAnswerIndex: 0,
      selectedAnswerIndex: 2,
      lockedAnswerIndex: 2,
      responseTimeMs: 17_000,
      firstSelectionTimeMs: 12_000,
      selectionChangeCount: 2,
      timeRemainingAtLock: 3,
      lockedWithUnder5s: true,
      timedOutWithoutLock: false
    },
    {
      questionId: "q-03",
      questionRank: 3,
      category: "History",
      result: "timeout",
      correctAnswerIndex: 2,
      selectedAnswerIndex: null,
      lockedAnswerIndex: null,
      responseTimeMs: 20_000,
      firstSelectionTimeMs: null,
      selectionChangeCount: 0,
      timeRemainingAtLock: null,
      lockedWithUnder5s: false,
      timedOutWithoutLock: true
    }
  ]);

  assert.equal(summary.correctCount, 1);
  assert.equal(summary.incorrectCount, 1);
  assert.equal(summary.timeoutCount, 1);
  assert.equal(summary.averageResponseTimeMs, 14_333);
  assert.equal(summary.averageFirstSelectionTimeMs, 7_000);
  assert.equal(summary.selectionChangeRate, 0.67);
  assert.equal(summary.under5sLockCount, 1);
  assert.equal(summary.pressureMissCount, 1);
  assert.deepEqual(summary.categoryBreakdown, {
    Science: {
      questions: 2,
      correctCount: 1,
      timeoutCount: 0,
      averageResponseTimeMs: 11_500
    },
    History: {
      questions: 1,
      correctCount: 0,
      timeoutCount: 1,
      averageResponseTimeMs: 20_000
    }
  });
});

test("player model snapshot derives interpretable rates and styles", () => {
  const questionSignals = [
    {
      questionId: "q-01",
      questionRank: 1,
      category: "Science",
      result: "correct" as const,
      correctAnswerIndex: 1,
      selectedAnswerIndex: 1,
      lockedAnswerIndex: 1,
      responseTimeMs: 4_000,
      firstSelectionTimeMs: 1_800,
      selectionChangeCount: 0,
      timeRemainingAtLock: 16,
      lockedWithUnder5s: false,
      timedOutWithoutLock: false
    },
    {
      questionId: "q-02",
      questionRank: 2,
      category: "Science",
      result: "correct" as const,
      correctAnswerIndex: 0,
      selectedAnswerIndex: 0,
      lockedAnswerIndex: 0,
      responseTimeMs: 5_000,
      firstSelectionTimeMs: 2_000,
      selectionChangeCount: 0,
      timeRemainingAtLock: 15,
      lockedWithUnder5s: false,
      timedOutWithoutLock: false
    },
    {
      questionId: "q-03",
      questionRank: 3,
      category: "History",
      result: "correct" as const,
      correctAnswerIndex: 2,
      selectedAnswerIndex: 2,
      lockedAnswerIndex: 2,
      responseTimeMs: 6_000,
      firstSelectionTimeMs: 2_100,
      selectionChangeCount: 0,
      timeRemainingAtLock: 14,
      lockedWithUnder5s: false,
      timedOutWithoutLock: false
    },
    {
      questionId: "q-04",
      questionRank: 4,
      category: "History",
      result: "correct" as const,
      correctAnswerIndex: 1,
      selectedAnswerIndex: 1,
      lockedAnswerIndex: 1,
      responseTimeMs: 6_500,
      firstSelectionTimeMs: 2_500,
      selectionChangeCount: 0,
      timeRemainingAtLock: 13,
      lockedWithUnder5s: false,
      timedOutWithoutLock: false
    },
    {
      questionId: "q-05",
      questionRank: 5,
      category: "Math",
      result: "correct" as const,
      correctAnswerIndex: 0,
      selectedAnswerIndex: 0,
      lockedAnswerIndex: 0,
      responseTimeMs: 7_000,
      firstSelectionTimeMs: 3_000,
      selectionChangeCount: 1,
      timeRemainingAtLock: 4,
      lockedWithUnder5s: true,
      timedOutWithoutLock: false
    },
    {
      questionId: "q-06",
      questionRank: 6,
      category: "Math",
      result: "incorrect" as const,
      correctAnswerIndex: 1,
      selectedAnswerIndex: 2,
      lockedAnswerIndex: 2,
      responseTimeMs: 8_000,
      firstSelectionTimeMs: 3_200,
      selectionChangeCount: 1,
      timeRemainingAtLock: 3,
      lockedWithUnder5s: true,
      timedOutWithoutLock: false
    }
  ];

  const snapshot = buildPlayerModelSnapshot({
    questionSignals,
    runsObserved: 1
  });

  assert.equal(snapshot.runsObserved, 1);
  assert.equal(snapshot.questionsObserved, 6);
  assert.equal(snapshot.accuracyRate, 0.833);
  assert.equal(snapshot.timeoutRate, 0);
  assert.equal(snapshot.avgResponseTimeMs, 6083);
  assert.equal(snapshot.avgFirstSelectionTimeMs, 2433);
  assert.equal(snapshot.avgSelectionChangeCount, 0.333);
  assert.equal(snapshot.pressureAccuracyRate, 0.5);
  assert.equal(snapshot.pressureTimeoutRate, 0);
  assert.equal(snapshot.confidenceStyle, "decisive");
  assert.equal(snapshot.hesitationStyle, "fast-reader");
  assert.equal(snapshot.pressureStyle, "pressure-sensitive");
  assert.deepEqual(snapshot.categorySnapshot.Math, {
    questions: 2,
    accuracyRate: 0.5,
    timeoutRate: 0,
    averageResponseTimeMs: 7500
  });
});

test("player model uses insufficient-data styles when observations are too thin", () => {
  const snapshot = buildPlayerModelSnapshot({
    runsObserved: 1,
    questionSignals: [
      {
        questionId: "q-01",
        questionRank: 1,
        category: "Science",
        result: "correct",
        correctAnswerIndex: 1,
        selectedAnswerIndex: 1,
        lockedAnswerIndex: 1,
        responseTimeMs: 5000,
        firstSelectionTimeMs: 2000,
        selectionChangeCount: 0,
        timeRemainingAtLock: 15,
        lockedWithUnder5s: false,
        timedOutWithoutLock: false
      }
    ]
  });

  assert.equal(snapshot.confidenceStyle, "insufficient-data");
  assert.equal(snapshot.hesitationStyle, "insufficient-data");
  assert.equal(snapshot.pressureStyle, "insufficient-data");
});

test("confidence style respects threshold boundaries for decisive and wavering cases", () => {
  const decisiveSignals = Array.from({ length: PLAYER_MODEL_THRESHOLDS.minimumQuestionsForStyle }, (_, index) => ({
    questionId: `q-d-${index}`,
    questionRank: index + 1,
    category: "Logic",
    result: index < 5 ? ("correct" as const) : ("incorrect" as const),
    correctAnswerIndex: 1,
    selectedAnswerIndex: 1,
    lockedAnswerIndex: 1,
    responseTimeMs: 6000,
    firstSelectionTimeMs: 2000,
    selectionChangeCount: index < 2 ? 1 : 0,
    timeRemainingAtLock: 9,
    lockedWithUnder5s: false,
    timedOutWithoutLock: false
  }));

  const decisive = buildPlayerModelSnapshot({
    runsObserved: 2,
    questionSignals: decisiveSignals
  });

  assert.equal(decisive.accuracyRate, 0.833);
  assert.equal(decisive.avgSelectionChangeCount, 0.333);
  assert.equal(decisive.confidenceStyle, "decisive");

  const waveringSignals = Array.from({ length: PLAYER_MODEL_THRESHOLDS.minimumQuestionsForStyle }, (_, index) => ({
    questionId: `q-w-${index}`,
    questionRank: index + 1,
    category: "Logic",
    result: index < 3 ? ("correct" as const) : ("incorrect" as const),
    correctAnswerIndex: 1,
    selectedAnswerIndex: 2,
    lockedAnswerIndex: 2,
    responseTimeMs: 7000,
    firstSelectionTimeMs: 2500,
    selectionChangeCount: 1,
    timeRemainingAtLock: 8,
    lockedWithUnder5s: false,
    timedOutWithoutLock: false
  }));

  const wavering = buildPlayerModelSnapshot({
    runsObserved: 2,
    questionSignals: waveringSignals
  });

  assert.equal(wavering.avgSelectionChangeCount, 1);
  assert.equal(wavering.confidenceStyle, "wavering");
});

test("hesitation and pressure styles respect edge thresholds conservatively", () => {
  const lateCommitterSignals = Array.from({ length: PLAYER_MODEL_THRESHOLDS.minimumQuestionsForStyle }, (_, index) => ({
    questionId: `q-l-${index}`,
    questionRank: index + 1,
    category: "History",
    result: "correct" as const,
    correctAnswerIndex: 1,
    selectedAnswerIndex: 1,
    lockedAnswerIndex: 1,
    responseTimeMs: PLAYER_MODEL_THRESHOLDS.lateCommitterResponseMs,
    firstSelectionTimeMs: 7000,
    selectionChangeCount: 0,
    timeRemainingAtLock: 6,
    lockedWithUnder5s: false,
    timedOutWithoutLock: false
  }));

  const lateCommitter = buildPlayerModelSnapshot({
    runsObserved: 3,
    questionSignals: lateCommitterSignals
  });

  assert.equal(lateCommitter.hesitationStyle, "late-committer");

  const notEnoughPressureSignals = [
    ...Array.from({ length: PLAYER_MODEL_THRESHOLDS.minimumQuestionsForStyle - 1 }, (_, index) => ({
      questionId: `q-pi-${index}`,
      questionRank: index + 1,
      category: "Math",
      result: "correct" as const,
      correctAnswerIndex: 1,
      selectedAnswerIndex: 1,
      lockedAnswerIndex: 1,
      responseTimeMs: 5000,
      firstSelectionTimeMs: 2000,
      selectionChangeCount: 0,
      timeRemainingAtLock: 10,
      lockedWithUnder5s: false,
      timedOutWithoutLock: false
    })),
    {
      questionId: "q-pi-edge",
      questionRank: PLAYER_MODEL_THRESHOLDS.minimumQuestionsForStyle,
      category: "Math",
      result: "correct" as const,
      correctAnswerIndex: 1,
      selectedAnswerIndex: 1,
      lockedAnswerIndex: 1,
      responseTimeMs: 5000,
      firstSelectionTimeMs: 2000,
      selectionChangeCount: 0,
      timeRemainingAtLock: 4,
      lockedWithUnder5s: true,
      timedOutWithoutLock: false
    }
  ];

  const insufficientPressure = buildPlayerModelSnapshot({
    runsObserved: 3,
    questionSignals: notEnoughPressureSignals
  });

  assert.equal(insufficientPressure.pressureStyle, "insufficient-data");

  const timeoutProneSignals = Array.from({ length: PLAYER_MODEL_THRESHOLDS.minimumQuestionsForStyle }, (_, index) => ({
    questionId: `q-pt-${index}`,
    questionRank: index + 1,
    category: "Math",
    result: index < 2 ? ("timeout" as const) : ("incorrect" as const),
    correctAnswerIndex: 1,
    selectedAnswerIndex: index < 2 ? null : 2,
    lockedAnswerIndex: index < 2 ? null : 2,
    responseTimeMs: 18000,
    firstSelectionTimeMs: index < 2 ? null : 12000,
    selectionChangeCount: 1,
    timeRemainingAtLock: index < 2 ? null : 3,
    lockedWithUnder5s: true,
    timedOutWithoutLock: index < 2
  }));

  const timeoutProne = buildPlayerModelSnapshot({
    runsObserved: 4,
    questionSignals: timeoutProneSignals
  });

  assert.equal(timeoutProne.pressureTimeoutRate, 0.333);
  assert.equal(timeoutProne.pressureStyle, "pressure-sensitive");

  const clearlyTimeoutProne = buildPlayerModelSnapshot({
    runsObserved: 5,
    questionSignals: timeoutProneSignals.map((signal, index) =>
      index < 3
        ? { ...signal, result: "timeout" as const, selectedAnswerIndex: null, lockedAnswerIndex: null, timedOutWithoutLock: true }
        : signal
    )
  });

  assert.equal(clearlyTimeoutProne.pressureTimeoutRate, 0.5);
  assert.equal(clearlyTimeoutProne.pressureStyle, "timeout-prone");
});

test("category snapshot stays compact for sparse categories", () => {
  const snapshot = buildPlayerModelSnapshot({
    runsObserved: 2,
    questionSignals: [
      {
        questionId: "q-c-01",
        questionRank: 1,
        category: "Science",
        result: "correct",
        correctAnswerIndex: 1,
        selectedAnswerIndex: 1,
        lockedAnswerIndex: 1,
        responseTimeMs: 6000,
        firstSelectionTimeMs: 2000,
        selectionChangeCount: 0,
        timeRemainingAtLock: 12,
        lockedWithUnder5s: false,
        timedOutWithoutLock: false
      },
      {
        questionId: "q-c-02",
        questionRank: 2,
        category: "Art",
        result: "timeout",
        correctAnswerIndex: 2,
        selectedAnswerIndex: null,
        lockedAnswerIndex: null,
        responseTimeMs: 20000,
        firstSelectionTimeMs: null,
        selectionChangeCount: 0,
        timeRemainingAtLock: null,
        lockedWithUnder5s: false,
        timedOutWithoutLock: true
      }
    ]
  });

  assert.deepEqual(snapshot.categorySnapshot, {
    Science: {
      questions: 1,
      accuracyRate: 1,
      timeoutRate: 0,
      averageResponseTimeMs: 6000
    },
    Art: {
      questions: 1,
      accuracyRate: 0,
      timeoutRate: 1,
      averageResponseTimeMs: 20000
    }
  });
});
