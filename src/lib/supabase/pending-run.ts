import type { PendingRunBridge } from "../../domain/persistence.ts";

const PENDING_RUN_STORAGE_KEY = "mmrm.pending-run.v1";
const PENDING_RUN_MAX_AGE_MS = 1000 * 60 * 30;

type PendingRunStored = {
  savedAt: string;
  run: PendingRunBridge;
};

function canUseStorage() {
  return typeof window !== "undefined";
}

function getStorages() {
  if (!canUseStorage()) {
    return [];
  }

  return [window.sessionStorage, window.localStorage].filter(Boolean);
}

function clearStorageValue() {
  for (const storage of getStorages()) {
    storage.removeItem(PENDING_RUN_STORAGE_KEY);
  }
}

function clearStorageValueFor(storage: Storage) {
  storage.removeItem(PENDING_RUN_STORAGE_KEY);
}

export function readPendingRunBridge() {
  for (const storage of getStorages()) {
    const serialized = storage.getItem(PENDING_RUN_STORAGE_KEY);

    if (!serialized) {
      continue;
    }

    try {
      const parsed = JSON.parse(serialized) as Partial<PendingRunStored>;
      const savedAt = typeof parsed.savedAt === "string" ? Date.parse(parsed.savedAt) : Number.NaN;
      const run = parsed.run;

      if (
        Number.isNaN(savedAt) ||
        Date.now() - savedAt > PENDING_RUN_MAX_AGE_MS ||
        !run ||
        typeof run.localRunKey !== "string" ||
        typeof run.startedAt !== "string" ||
        typeof run.completedAt !== "string" ||
        typeof run.outcome !== "string" ||
        typeof run.highestRank !== "number" ||
        typeof run.correctAnswers !== "number" ||
        typeof run.totalQuestions !== "number" ||
        typeof run.questionSetVersion !== "string"
      ) {
        clearStorageValueFor(storage);
        continue;
      }

      return run as PendingRunBridge;
    } catch {
      clearStorageValueFor(storage);
      continue;
    }
  }

  clearStorageValue();

  return null;
}

export function writePendingRunBridge(run: PendingRunBridge) {
  const storages = getStorages();

  if (storages.length === 0) {
    return;
  }

  const payload: PendingRunStored = {
    savedAt: new Date().toISOString(),
    run
  };

  for (const storage of storages) {
    storage.setItem(PENDING_RUN_STORAGE_KEY, JSON.stringify(payload));
  }
}

export function clearPendingRunBridge() {
  clearStorageValue();
}
