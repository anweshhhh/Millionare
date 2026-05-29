import assert from "node:assert/strict";
import test from "node:test";
import type { PendingRunBridge } from "../../domain/persistence.ts";
import { buildRunBehaviorSummary } from "../../domain/player-model.ts";
import { clearPendingRunBridge, readPendingRunBridge, writePendingRunBridge } from "./pending-run.ts";

function createStorage() {
  const store = new Map<string, string>();

  return {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    }
  };
}

const sampleRun: PendingRunBridge = {
  localRunKey: "run-1",
  startedAt: "2026-04-05T10:00:00.000Z",
  completedAt: "2026-04-05T10:05:00.000Z",
  outcome: "completed",
  highestRank: 12,
  correctAnswers: 12,
  totalQuestions: 12,
  failureReason: null,
  bestReserveSeconds: 7,
  questionSetVersion: "seed-v1",
  avgResponseTimeMs: 6000,
  avgFirstSelectionTimeMs: 2500,
  selectionChangeRate: 0,
  pressureMissCount: 0,
  timeoutCount: 0,
  categorySummary: {
    Science: {
      questions: 1,
      correctCount: 1,
      timeoutCount: 0,
      averageResponseTimeMs: 6000
    }
  },
  behaviorSummary: buildRunBehaviorSummary([
    {
      questionId: "q-01",
      questionRank: 1,
      category: "Science",
      result: "correct",
      correctAnswerIndex: 1,
      selectedAnswerIndex: 1,
      lockedAnswerIndex: 1,
      responseTimeMs: 6000,
      firstSelectionTimeMs: 2500,
      selectionChangeCount: 0,
      timeRemainingAtLock: 14,
      lockedWithUnder5s: false,
      timedOutWithoutLock: false
    }
  ]),
  questionSignals: [
    {
      questionId: "q-01",
      questionRank: 1,
      category: "Science",
      result: "correct",
      correctAnswerIndex: 1,
      selectedAnswerIndex: 1,
      lockedAnswerIndex: 1,
      responseTimeMs: 6000,
      firstSelectionTimeMs: 2500,
      selectionChangeCount: 0,
      timeRemainingAtLock: 14,
      lockedWithUnder5s: false,
      timedOutWithoutLock: false
    }
  ]
};

test("pending run bridge survives local storage reads", () => {
  const sessionStorage = createStorage();
  const localStorage = createStorage();

  globalThis.window = {
    sessionStorage,
    localStorage
  } as typeof window;

  writePendingRunBridge(sampleRun);
  sessionStorage.removeItem("mmrm.pending-run.v1");

  assert.deepEqual(readPendingRunBridge(), sampleRun);

  clearPendingRunBridge();
  assert.equal(readPendingRunBridge(), null);
});

test("pending run bridge falls back to the remaining storage copy", () => {
  const sessionStorage = createStorage();
  const localStorage = createStorage();

  globalThis.window = {
    sessionStorage,
    localStorage
  } as typeof window;

  sessionStorage.setItem("mmrm.pending-run.v1", "not-json");
  writePendingRunBridge(sampleRun);

  assert.deepEqual(readPendingRunBridge(), sampleRun);
});
