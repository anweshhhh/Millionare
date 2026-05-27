import assert from "node:assert/strict";
import test from "node:test";
import { buildPlayerModelSnapshot, buildRunBehaviorSummary, type QuestionBehaviorSignal } from "./player-model.ts";
import { deriveInsightCandidates, deriveInsightSummary } from "./insights.ts";

function createSignal(input: Partial<QuestionBehaviorSignal> & Pick<QuestionBehaviorSignal, "questionId" | "category" | "result">): QuestionBehaviorSignal {
  return {
    questionId: input.questionId,
    questionRank: input.questionRank ?? 1,
    category: input.category,
    result: input.result,
    correctAnswerIndex: input.correctAnswerIndex ?? 0,
    selectedAnswerIndex: input.selectedAnswerIndex ?? (input.result === "timeout" ? null : 0),
    lockedAnswerIndex: input.lockedAnswerIndex ?? (input.result === "timeout" ? null : 0),
    responseTimeMs: input.responseTimeMs ?? 6000,
    firstSelectionTimeMs: input.firstSelectionTimeMs ?? (input.result === "timeout" ? null : 1800),
    selectionChangeCount: input.selectionChangeCount ?? 0,
    timeRemainingAtLock: input.timeRemainingAtLock ?? (input.result === "timeout" ? null : 8),
    lockedWithUnder5s: input.lockedWithUnder5s ?? false,
    timedOutWithoutLock: input.timedOutWithoutLock ?? input.result === "timeout"
  };
}

test("strong evidence produces a primary pressure insight and optional secondary", () => {
  const questionSignals = [
    createSignal({
      questionId: "q-1",
      category: "Science",
      result: "correct",
      responseTimeMs: 5000,
      timeRemainingAtLock: 4,
      lockedWithUnder5s: true
    }),
    createSignal({
      questionId: "q-2",
      category: "History",
      result: "correct",
      responseTimeMs: 4800,
      timeRemainingAtLock: 3,
      lockedWithUnder5s: true
    }),
    createSignal({
      questionId: "q-3",
      category: "Art",
      result: "correct",
      responseTimeMs: 4500,
      timeRemainingAtLock: 2,
      lockedWithUnder5s: true
    })
  ];

  const playerModel = buildPlayerModelSnapshot({
    runsObserved: 4,
    questionSignals: [
      ...questionSignals,
      createSignal({
        questionId: "q-4",
        category: "Math",
        result: "correct",
        responseTimeMs: 5200,
        timeRemainingAtLock: 3,
        lockedWithUnder5s: true
      }),
      createSignal({
        questionId: "q-5",
        category: "Geography",
        result: "correct",
        responseTimeMs: 5100,
        timeRemainingAtLock: 4,
        lockedWithUnder5s: true
      }),
      createSignal({
        questionId: "q-6",
        category: "Biology",
        result: "correct",
        responseTimeMs: 4700,
        timeRemainingAtLock: 2,
        lockedWithUnder5s: true
      })
    ]
  });

  const summary = deriveInsightSummary({
    runSummary: buildRunBehaviorSummary(questionSignals),
    questionSignals,
    playerModel,
    resultContext: {
      outcome: "completed",
      failureReason: null,
      highestRank: 3,
      correctAnswers: 3,
      totalQuestions: 12
    }
  });

  assert.equal(summary.primary?.family, "pressure-read");
  assert.equal(summary.primary?.strength, "strong");
  assert.match(summary.primary?.text ?? "", /clock narrowed|clear/i);
});

test("guest path can still surface a strong current-run insight without a player model snapshot", () => {
  const questionSignals = [
    createSignal({
      questionId: "q-1",
      category: "Science",
      result: "correct",
      responseTimeMs: 5200,
      timeRemainingAtLock: 4,
      lockedWithUnder5s: true
    }),
    createSignal({
      questionId: "q-2",
      category: "History",
      result: "incorrect",
      responseTimeMs: 6100,
      timeRemainingAtLock: 3,
      lockedWithUnder5s: true
    }),
    createSignal({
      questionId: "q-3",
      category: "Math",
      result: "timeout",
      firstSelectionTimeMs: null,
      lockedAnswerIndex: null,
      selectedAnswerIndex: null,
      timedOutWithoutLock: true
    })
  ];

  const summary = deriveInsightSummary({
    runSummary: buildRunBehaviorSummary(questionSignals),
    questionSignals,
    playerModel: null,
    resultContext: {
      outcome: "eliminated",
      failureReason: "timeout",
      highestRank: 1,
      correctAnswers: 1,
      totalQuestions: 12
    }
  });

  assert.ok(
    summary.primary?.family === "pressure-read" || summary.primary?.family === "ending-pattern-read"
  );
  assert.match(summary.primary?.text ?? "", /clock broke this run|time pressure/i);
});

test("insufficient data suppresses generic insights instead of filling space", () => {
  const questionSignals = [
    createSignal({
      questionId: "q-1",
      category: "Science",
      result: "incorrect",
      responseTimeMs: 7000,
      selectionChangeCount: 1
    }),
    createSignal({
      questionId: "q-2",
      category: "History",
      result: "correct",
      responseTimeMs: 6200,
      selectionChangeCount: 0
    })
  ];

  const summary = deriveInsightSummary({
    runSummary: buildRunBehaviorSummary(questionSignals),
    questionSignals,
    playerModel: null,
    resultContext: {
      outcome: "eliminated",
      failureReason: "wrong-answer",
      highestRank: 1,
      correctAnswers: 1,
      totalQuestions: 12
    }
  });

  assert.equal(summary.primary, null);
  assert.equal(summary.secondary, null);
});

test("contradiction with the persisted model softens the insight instead of overstating it", () => {
  const currentRunSignals = [
    createSignal({
      questionId: "q-1",
      category: "Science",
      result: "incorrect",
      selectionChangeCount: 2,
      responseTimeMs: 14000,
      firstSelectionTimeMs: 9000
    }),
    createSignal({
      questionId: "q-2",
      category: "History",
      result: "correct",
      selectionChangeCount: 2,
      responseTimeMs: 15000,
      firstSelectionTimeMs: 9300
    }),
    createSignal({
      questionId: "q-3",
      category: "Math",
      result: "incorrect",
      selectionChangeCount: 3,
      responseTimeMs: 16000,
      firstSelectionTimeMs: 9800
    })
  ];

  const decisiveModel = buildPlayerModelSnapshot({
    runsObserved: 5,
    questionSignals: [
      createSignal({ questionId: "m-1", category: "Art", result: "correct", selectionChangeCount: 0, responseTimeMs: 4000, firstSelectionTimeMs: 1500 }),
      createSignal({ questionId: "m-2", category: "Art", result: "correct", selectionChangeCount: 0, responseTimeMs: 4200, firstSelectionTimeMs: 1600 }),
      createSignal({ questionId: "m-3", category: "Science", result: "correct", selectionChangeCount: 0, responseTimeMs: 4300, firstSelectionTimeMs: 1700 }),
      createSignal({ questionId: "m-4", category: "History", result: "correct", selectionChangeCount: 0, responseTimeMs: 4100, firstSelectionTimeMs: 1600 }),
      createSignal({ questionId: "m-5", category: "Math", result: "correct", selectionChangeCount: 0, responseTimeMs: 4400, firstSelectionTimeMs: 1800 }),
      createSignal({ questionId: "m-6", category: "Biology", result: "correct", selectionChangeCount: 0, responseTimeMs: 4500, firstSelectionTimeMs: 1900 })
    ]
  });

  const candidates = deriveInsightCandidates({
    runSummary: buildRunBehaviorSummary(currentRunSignals),
    questionSignals: currentRunSignals,
    playerModel: decisiveModel,
    resultContext: {
      outcome: "eliminated",
      failureReason: "wrong-answer",
      highestRank: 1,
      correctAnswers: 1,
      totalQuestions: 12
    }
  });

  const confidenceCandidate = candidates.find((candidate) => candidate.family === "confidence-read");

  assert.ok(confidenceCandidate);
  assert.equal(confidenceCandidate?.strength, "softened");
  assert.match(confidenceCandidate?.text ?? "", /reads started to drift|read carefully/i);
});

test("signed-in supporting model evidence can elevate a weak-spot read into a viable candidate", () => {
  const currentRunSignals = [
    createSignal({
      questionId: "q-1",
      category: "Science",
      result: "correct",
      responseTimeMs: 6400
    }),
    createSignal({
      questionId: "q-2",
      category: "Science",
      result: "incorrect",
      responseTimeMs: 9800
    }),
    createSignal({
      questionId: "q-3",
      category: "Science",
      result: "timeout",
      firstSelectionTimeMs: null,
      lockedAnswerIndex: null,
      selectedAnswerIndex: null,
      timedOutWithoutLock: true
    }),
    createSignal({
      questionId: "q-4",
      category: "History",
      result: "correct",
      responseTimeMs: 5200
    })
  ];

  const supportingModel = buildPlayerModelSnapshot({
    runsObserved: 5,
    questionSignals: [
      createSignal({ questionId: "m-1", category: "Science", result: "incorrect", responseTimeMs: 9100 }),
      createSignal({ questionId: "m-2", category: "Science", result: "incorrect", responseTimeMs: 9400 }),
      createSignal({
        questionId: "m-3",
        category: "Science",
        result: "timeout",
        firstSelectionTimeMs: null,
        lockedAnswerIndex: null,
        selectedAnswerIndex: null,
        timedOutWithoutLock: true
      }),
      createSignal({ questionId: "m-4", category: "History", result: "correct", responseTimeMs: 5000 }),
      createSignal({ questionId: "m-5", category: "History", result: "correct", responseTimeMs: 5100 }),
      createSignal({ questionId: "m-6", category: "Art", result: "correct", responseTimeMs: 5200 })
    ]
  });

  const candidates = deriveInsightCandidates({
    runSummary: buildRunBehaviorSummary(currentRunSignals),
    questionSignals: currentRunSignals,
    playerModel: supportingModel,
    resultContext: {
      outcome: "eliminated",
      failureReason: "timeout",
      highestRank: 2,
      correctAnswers: 2,
      totalQuestions: 12
    }
  });

  const weakSpotCandidate = candidates.find((candidate) => candidate.family === "weak-spot-read");

  assert.ok(weakSpotCandidate);
  assert.equal(weakSpotCandidate?.strength, "strong");
  assert.match(weakSpotCandidate?.text ?? "", /Science slowed you down before it beat you\./);
});

test("timeout endings and wrong-answer endings produce different ending-pattern insights", () => {
  const timeoutSignals = [
    createSignal({ questionId: "q-1", category: "Science", result: "correct" }),
    createSignal({ questionId: "q-2", category: "History", result: "correct" }),
    createSignal({ questionId: "q-3", category: "Math", result: "timeout", lockedAnswerIndex: null, selectedAnswerIndex: null, firstSelectionTimeMs: null, timedOutWithoutLock: true })
  ];

  const timeoutSummary = deriveInsightSummary({
    runSummary: buildRunBehaviorSummary(timeoutSignals),
    questionSignals: timeoutSignals,
    playerModel: null,
    resultContext: {
      outcome: "eliminated",
      failureReason: "timeout",
      highestRank: 2,
      correctAnswers: 2,
      totalQuestions: 12
    }
  });

  assert.match(timeoutSummary.primary?.text ?? "", /time pressure/i);

  const wrongAnswerSignals = [
    createSignal({ questionId: "q-1", category: "Science", result: "correct" }),
    createSignal({ questionId: "q-2", category: "History", result: "correct" }),
    createSignal({
      questionId: "q-3",
      category: "Math",
      result: "incorrect",
      responseTimeMs: 6500,
      firstSelectionTimeMs: 2200,
      selectionChangeCount: 0,
      lockedAnswerIndex: 1,
      selectedAnswerIndex: 1
    })
  ];

  const wrongAnswerSummary = deriveInsightSummary({
    runSummary: buildRunBehaviorSummary(wrongAnswerSignals),
    questionSignals: wrongAnswerSignals,
    playerModel: null,
    resultContext: {
      outcome: "eliminated",
      failureReason: "wrong-answer",
      highestRank: 2,
      correctAnswers: 2,
      totalQuestions: 12
    }
  });

  assert.match(wrongAnswerSummary.primary?.text ?? "", /certainty, not hesitation/i);
});

test("short contradictory runs suppress filler instead of forcing a secondary insight", () => {
  const questionSignals = [
    createSignal({
      questionId: "q-1",
      category: "Science",
      result: "correct",
      responseTimeMs: 4500,
      selectionChangeCount: 0
    }),
    createSignal({
      questionId: "q-2",
      category: "History",
      result: "incorrect",
      responseTimeMs: 14600,
      firstSelectionTimeMs: 9100,
      selectionChangeCount: 2
    }),
    createSignal({
      questionId: "q-3",
      category: "Art",
      result: "correct",
      responseTimeMs: 4700,
      selectionChangeCount: 0
    })
  ];

  const decisiveModel = buildPlayerModelSnapshot({
    runsObserved: 5,
    questionSignals: [
      createSignal({ questionId: "m-1", category: "Math", result: "correct", selectionChangeCount: 0, responseTimeMs: 4100, firstSelectionTimeMs: 1600 }),
      createSignal({ questionId: "m-2", category: "Math", result: "correct", selectionChangeCount: 0, responseTimeMs: 4200, firstSelectionTimeMs: 1500 }),
      createSignal({ questionId: "m-3", category: "Science", result: "correct", selectionChangeCount: 0, responseTimeMs: 4300, firstSelectionTimeMs: 1700 }),
      createSignal({ questionId: "m-4", category: "History", result: "correct", selectionChangeCount: 0, responseTimeMs: 4400, firstSelectionTimeMs: 1800 }),
      createSignal({ questionId: "m-5", category: "Art", result: "correct", selectionChangeCount: 0, responseTimeMs: 4500, firstSelectionTimeMs: 1900 }),
      createSignal({ questionId: "m-6", category: "Biology", result: "correct", selectionChangeCount: 0, responseTimeMs: 4600, firstSelectionTimeMs: 2000 })
    ]
  });

  const summary = deriveInsightSummary({
    runSummary: buildRunBehaviorSummary(questionSignals),
    questionSignals,
    playerModel: decisiveModel,
    resultContext: {
      outcome: "eliminated",
      failureReason: "wrong-answer",
      highestRank: 2,
      correctAnswers: 2,
      totalQuestions: 12
    }
  });

  assert.equal(summary.secondary, null);
});
