const RECENT_RUN_MEMORY_KEY = "mmrm.recent-run-ids.v1";
const RUN_SEED_COUNTER_KEY = "mmrm.run-seed-counter.v1";
const MAX_TRACKED_RUNS = 5;

type RecentRunMemory = {
  runs: string[][];
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

function readRawMemory() {
  for (const storage of getStorages()) {
    const raw = storage.getItem(RECENT_RUN_MEMORY_KEY);

    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<RecentRunMemory>;
      if (!Array.isArray(parsed.runs)) {
        continue;
      }

      const runs = parsed.runs
        .filter((run) => Array.isArray(run))
        .map((run) =>
          run.filter((questionId): questionId is string => typeof questionId === "string" && questionId.length > 0)
        )
        .filter((run) => run.length > 0);

      return { runs } satisfies RecentRunMemory;
    } catch {
      continue;
    }
  }

  return { runs: [] } satisfies RecentRunMemory;
}

function writeRawMemory(memory: RecentRunMemory) {
  const payload = JSON.stringify(memory);
  for (const storage of getStorages()) {
    storage.setItem(RECENT_RUN_MEMORY_KEY, payload);
  }
}

function readRunSeedCounter() {
  let highest = 0;

  for (const storage of getStorages()) {
    const raw = storage.getItem(RUN_SEED_COUNTER_KEY);
    const value = Number(raw);

    if (Number.isFinite(value) && value > highest) {
      highest = Math.floor(value);
    }
  }

  return highest;
}

function writeRunSeedCounter(counter: number) {
  for (const storage of getStorages()) {
    storage.setItem(RUN_SEED_COUNTER_KEY, String(counter));
  }
}

export function reserveNextRunSeed() {
  if (!canUseStorage()) {
    return Date.now();
  }

  const next = readRunSeedCounter() + 1;
  writeRunSeedCounter(next);
  return next;
}

export function getRecentRunAvoidIds() {
  const memory = readRawMemory();
  return Array.from(new Set(memory.runs.flat()));
}

export function storeRecentRunQuestionIds(questionIds: string[]) {
  if (questionIds.length === 0) {
    return;
  }

  const dedupedRun = Array.from(new Set(questionIds));
  const memory = readRawMemory();
  const nextRuns = [dedupedRun, ...memory.runs.filter((run) => run.join("|") !== dedupedRun.join("|"))].slice(
    0,
    MAX_TRACKED_RUNS
  );
  writeRawMemory({ runs: nextRuns });
}

export function clearRecentRunMemory() {
  for (const storage of getStorages()) {
    storage.removeItem(RECENT_RUN_MEMORY_KEY);
    storage.removeItem(RUN_SEED_COUNTER_KEY);
  }
}
