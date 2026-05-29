import assert from "node:assert/strict";
import test from "node:test";
import {
  clearRecentRunMemory,
  getRecentRunAvoidIds,
  storeRecentRunQuestionIds
} from "./recent-run-memory.ts";

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

test("recent run memory stores up to five runs and returns deduped avoid ids", () => {
  const sessionStorage = createStorage();
  const localStorage = createStorage();

  globalThis.window = {
    sessionStorage,
    localStorage
  } as typeof window;

  clearRecentRunMemory();
  storeRecentRunQuestionIds(["q-1", "q-2", "q-3"]);
  storeRecentRunQuestionIds(["q-4", "q-5", "q-6"]);
  storeRecentRunQuestionIds(["q-7", "q-8", "q-9"]);
  storeRecentRunQuestionIds(["q-10", "q-11", "q-12"]);
  storeRecentRunQuestionIds(["q-13", "q-14", "q-15"]);
  storeRecentRunQuestionIds(["q-16", "q-17", "q-18"]);

  const avoidIds = getRecentRunAvoidIds();
  const avoidSet = new Set(avoidIds);

  assert.equal(avoidSet.size, 15);
  for (const questionId of [
    "q-4",
    "q-5",
    "q-6",
    "q-7",
    "q-8",
    "q-9",
    "q-10",
    "q-11",
    "q-12",
    "q-13",
    "q-14",
    "q-15",
    "q-16",
    "q-17",
    "q-18"
  ]) {
    assert.equal(avoidSet.has(questionId), true);
  }
});
