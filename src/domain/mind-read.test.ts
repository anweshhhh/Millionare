import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveMindReadPayload,
  deriveRevealMicroRead,
  deriveRunIdentity,
  deriveTransitionRead
} from "./mind-read.ts";
import { buildRunBehaviorSummary, type QuestionBehaviorSignal } from "./player-model.ts";

function createSignal(
  input: Partial<QuestionBehaviorSignal> &
    Pick<QuestionBehaviorSignal, "questionId" | "category" | "result">
): QuestionBehaviorSignal {
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

test("deriveRevealMicroRead returns pressure timeout copy", () => {
  const signal = createSignal({
    questionId: "q-1",
    category: "Science",
    result: "timeout",
    selectedAnswerIndex: null,
    lockedAnswerIndex: null,
    firstSelectionTimeMs: null
  });

  const read = deriveRevealMicroRead(
    {
      phase: "reveal",
      revealResult: "incorrect",
      failureReason: "timeout",
      pendingSecondChanceRecovery: false,
      isFinalQuestion: false
    },
    signal
  );

  assert.match(read ?? "", /No lock|Clock overrun/i);
});

test("deriveTransitionRead stays null unless reveal-correct on non-final questions", () => {
  const signal = createSignal({
    questionId: "q-1",
    category: "History",
    result: "correct"
  });

  assert.equal(
    deriveTransitionRead(
      {
        phase: "active",
        revealResult: null,
        failureReason: null,
        pendingSecondChanceRecovery: false,
        isFinalQuestion: false
      },
      signal
    ),
    null
  );

  assert.equal(
    deriveTransitionRead(
      {
        phase: "reveal",
        revealResult: "correct",
        failureReason: null,
        pendingSecondChanceRecovery: false,
        isFinalQuestion: true
      },
      signal
    ),
    null
  );
});

test("deriveRunIdentity returns clean-read identity for completed calm run", () => {
  const signals = [
    createSignal({ questionId: "q-1", category: "Science", result: "correct", lockedWithUnder5s: false }),
    createSignal({ questionId: "q-2", category: "History", result: "correct", lockedWithUnder5s: false }),
    createSignal({ questionId: "q-3", category: "Math", result: "correct", lockedWithUnder5s: false })
  ];

  const identity = deriveRunIdentity(buildRunBehaviorSummary(signals), signals, "completed");

  assert.equal(identity?.label, "The Clean Read");
});

test("deriveMindReadPayload combines reveal, transition, and identity safely", () => {
  const signals = [
    createSignal({
      questionId: "q-1",
      category: "Science",
      result: "correct",
      selectionChangeCount: 2,
      lockedWithUnder5s: true,
      responseTimeMs: 4600
    }),
    createSignal({
      questionId: "q-2",
      category: "History",
      result: "correct",
      selectionChangeCount: 2,
      lockedWithUnder5s: true,
      responseTimeMs: 5000
    }),
    createSignal({
      questionId: "q-3",
      category: "Math",
      result: "incorrect",
      selectionChangeCount: 2,
      lockedWithUnder5s: true,
      responseTimeMs: 4700
    })
  ];

  const payload = deriveMindReadPayload({
    revealContext: {
      phase: "reveal",
      revealResult: "correct",
      failureReason: null,
      pendingSecondChanceRecovery: false,
      isFinalQuestion: false
    },
    questionSignals: signals,
    runSummary: buildRunBehaviorSummary(signals),
    outcome: "eliminated",
    insightSummary: {
      primary: {
        family: "pressure-read",
        strength: "strong",
        confidence: "high",
        text: "Example",
        evidenceScore: 9
      },
      secondary: null
    }
  });

  assert.match(payload.revealMicroRead ?? "", /Late switch|Read shifted late/i);
  assert.match(payload.transitionRead ?? "", /Next read pushes pressure|next rung tests composure/i);
  assert.equal(payload.insightLabel, "clear signal");
  assert.ok(payload.runIdentity);
});
