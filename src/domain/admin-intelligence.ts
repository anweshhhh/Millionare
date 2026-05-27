import type { ContentQuestion } from "./content.ts";
import type { DifficultyBand, PressureTag } from "./game.ts";
import type {
  PersistedPlayerModel,
  PersistedQuestionBehaviorSignal,
  PersistedRun
} from "./persistence.ts";

export const ADMIN_INTELLIGENCE_THRESHOLDS = {
  minimumQuestionObservations: 3,
  stableQuestionObservations: 5,
  elevatedMissRate: 0.6,
  elevatedTimeoutRate: 0.34,
  highSelectionChangeAverage: 1,
  lateLockRate: 0.5,
  slowResponseTimeMs: 14_000,
  minimumDropoffRuns: 3,
  dropoffReviewRate: 0.5,
  dropoffWatchRate: 0.3,
  timeoutConcentrationReviewRate: 0.45,
  minimumAdaptationTransitions: 4,
  harshReboundReviewRate: 0.2,
  harshReboundWatchRate: 0.1,
  repeatedCategoryReviewRate: 0.34,
  difficultyLeapDistance: 2
} as const;

export type AdminSignalStatus = "review" | "watch" | "stable" | "low-confidence";
export type AdminSignalConfidence = "high" | "medium" | "low";

export type QuestionReviewFlag =
  | "elevated-miss-rate"
  | "elevated-timeout-rate"
  | "high-selection-churn"
  | "late-lock-instability"
  | "slow-response-anomaly";

export type QuestionCalibrationReview = {
  questionId: string;
  externalKey: string | null;
  category: string;
  difficultyBand: DifficultyBand | null;
  pressureTag: PressureTag | null;
  questionSetVersion: string | null;
  sourceLabel: string | null;
  observations: number;
  missRate: number;
  timeoutRate: number;
  averageResponseTimeMs: number;
  averageSelectionChangeCount: number;
  lateLockRate: number;
  flags: QuestionReviewFlag[];
  status: AdminSignalStatus;
  confidence: AdminSignalConfidence;
};

export type DropoffRankReview = {
  rank: number;
  endings: number;
  endingRate: number;
  timeoutEndings: number;
  timeoutRate: number;
  dominantCategory: string | null;
  status: AdminSignalStatus;
  confidence: AdminSignalConfidence;
};

export type AdaptationFairnessReview = {
  transitionsObserved: number;
  transitionsWithMetadata: number;
  harshPressureRebounds: number;
  timeoutPressureRebounds: number;
  repeatedCategoryRebounds: number;
  difficultyLeaps: number;
  status: AdminSignalStatus;
  confidence: AdminSignalConfidence;
  notes: Array<
    | "spiky-after-miss"
    | "spiky-after-timeout"
    | "repeated-category-rebound"
    | "difficulty-leap"
  >;
};

export type AdminIntelligenceReport = {
  summary: {
    runsObserved: number;
    eliminatedRunsObserved: number;
    questionSignalsObserved: number;
    questionReviewsProduced: number;
    playerModelsObserved: number;
  };
  questionReviews: QuestionCalibrationReview[];
  dropoffRanks: DropoffRankReview[];
  adaptationFairness: AdaptationFairnessReview;
};

type QuestionMetadata = {
  externalKey: string;
  category: string;
  difficultyBand: DifficultyBand;
  pressureTag: PressureTag;
  questionSetVersion: string;
  sourceLabel: string;
};

function roundRate(value: number) {
  return Number(value.toFixed(3));
}

function average(values: number[]) {
  return values.length === 0 ? 0 : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function buildQuestionMetadataMap(questions: ContentQuestion[]) {
  return new Map<string, QuestionMetadata>(
    questions.map((question) => [
      question.id,
      {
        externalKey: question.externalKey,
        category: question.category,
        difficultyBand: question.difficultyBand,
        pressureTag: question.pressureTag,
        questionSetVersion: question.questionSetVersion,
        sourceLabel: question.sourceLabel
      }
    ])
  );
}

function getConfidenceForObservationCount(observations: number): AdminSignalConfidence {
  if (observations < ADMIN_INTELLIGENCE_THRESHOLDS.minimumQuestionObservations) {
    return "low";
  }

  if (observations >= ADMIN_INTELLIGENCE_THRESHOLDS.stableQuestionObservations) {
    return "high";
  }

  return "medium";
}

function getQuestionReviewStatus(input: {
  observations: number;
  flags: QuestionReviewFlag[];
}) {
  if (input.observations < ADMIN_INTELLIGENCE_THRESHOLDS.minimumQuestionObservations) {
    return "low-confidence" as const;
  }

  if (
    input.flags.includes("elevated-timeout-rate") ||
    input.flags.includes("elevated-miss-rate") ||
    (input.flags.includes("high-selection-churn") && input.flags.includes("late-lock-instability"))
  ) {
    return "review" as const;
  }

  if (input.flags.length > 0) {
    return "watch" as const;
  }

  return "stable" as const;
}

function getDropoffStatus(input: {
  eliminatedRunsObserved: number;
  endings: number;
  endingRate: number;
  timeoutRate: number;
}) {
  if (input.eliminatedRunsObserved < ADMIN_INTELLIGENCE_THRESHOLDS.minimumDropoffRuns) {
    return "low-confidence" as const;
  }

  if (
    input.endingRate >= ADMIN_INTELLIGENCE_THRESHOLDS.dropoffReviewRate ||
    input.timeoutRate >= ADMIN_INTELLIGENCE_THRESHOLDS.timeoutConcentrationReviewRate
  ) {
    return "review" as const;
  }

  if (input.endingRate >= ADMIN_INTELLIGENCE_THRESHOLDS.dropoffWatchRate) {
    return "watch" as const;
  }

  return "stable" as const;
}

function getAdaptationStatus(input: {
  transitionsObserved: number;
  harshRate: number;
  repeatedCategoryRate: number;
  difficultyLeaps: number;
}) {
  if (input.transitionsObserved < ADMIN_INTELLIGENCE_THRESHOLDS.minimumAdaptationTransitions) {
    return "low-confidence" as const;
  }

  if (
    input.difficultyLeaps > 0 ||
    input.harshRate >= ADMIN_INTELLIGENCE_THRESHOLDS.harshReboundReviewRate ||
    input.repeatedCategoryRate >= ADMIN_INTELLIGENCE_THRESHOLDS.repeatedCategoryReviewRate
  ) {
    return "review" as const;
  }

  if (input.harshRate >= ADMIN_INTELLIGENCE_THRESHOLDS.harshReboundWatchRate) {
    return "watch" as const;
  }

  return "stable" as const;
}

export function deriveQuestionCalibrationReviews(input: {
  questionSignals: PersistedQuestionBehaviorSignal[];
  questions: ContentQuestion[];
}) {
  const metadataByQuestionId = buildQuestionMetadataMap(input.questions);
  const groupedSignals = input.questionSignals.reduce<Map<string, PersistedQuestionBehaviorSignal[]>>((accumulator, signal) => {
    const current = accumulator.get(signal.questionId) ?? [];
    current.push(signal);
    accumulator.set(signal.questionId, current);
    return accumulator;
  }, new Map());

  const reviews = [...groupedSignals.entries()].map<QuestionCalibrationReview>(([questionId, signals]) => {
    const metadata = metadataByQuestionId.get(questionId) ?? null;
    const observations = signals.length;
    const missCount = signals.filter((signal) => signal.result !== "correct").length;
    const timeoutCount = signals.filter((signal) => signal.result === "timeout").length;
    const lateLocks = signals.filter((signal) => signal.lockedWithUnder5s).length;
    const averageResponseTimeMs = average(signals.map((signal) => signal.responseTimeMs));
    const averageSelectionChangeCount = roundRate(
      signals.reduce((sum, signal) => sum + signal.selectionChangeCount, 0) / observations
    );
    const missRate = roundRate(missCount / observations);
    const timeoutRate = roundRate(timeoutCount / observations);
    const lateLockRate = roundRate(lateLocks / observations);

    const flags: QuestionReviewFlag[] = [];

    if (missRate >= ADMIN_INTELLIGENCE_THRESHOLDS.elevatedMissRate) {
      flags.push("elevated-miss-rate");
    }

    if (timeoutRate >= ADMIN_INTELLIGENCE_THRESHOLDS.elevatedTimeoutRate) {
      flags.push("elevated-timeout-rate");
    }

    if (averageSelectionChangeCount >= ADMIN_INTELLIGENCE_THRESHOLDS.highSelectionChangeAverage) {
      flags.push("high-selection-churn");
    }

    if (lateLockRate >= ADMIN_INTELLIGENCE_THRESHOLDS.lateLockRate) {
      flags.push("late-lock-instability");
    }

    if (averageResponseTimeMs >= ADMIN_INTELLIGENCE_THRESHOLDS.slowResponseTimeMs) {
      flags.push("slow-response-anomaly");
    }

    return {
      questionId,
      externalKey: metadata?.externalKey ?? null,
      category: metadata?.category ?? signals[0]?.category ?? "Unknown",
      difficultyBand: metadata?.difficultyBand ?? null,
      pressureTag: metadata?.pressureTag ?? null,
      questionSetVersion: metadata?.questionSetVersion ?? null,
      sourceLabel: metadata?.sourceLabel ?? null,
      observations,
      missRate,
      timeoutRate,
      averageResponseTimeMs,
      averageSelectionChangeCount,
      lateLockRate,
      flags,
      status: getQuestionReviewStatus({
        observations,
        flags
      }),
      confidence: getConfidenceForObservationCount(observations)
    };
  });

  return reviews.sort((left, right) => {
    const statusOrder = {
      review: 0,
      watch: 1,
      stable: 2,
      "low-confidence": 3
    } satisfies Record<AdminSignalStatus, number>;

    if (statusOrder[left.status] !== statusOrder[right.status]) {
      return statusOrder[left.status] - statusOrder[right.status];
    }

    if (left.observations !== right.observations) {
      return right.observations - left.observations;
    }

    return left.questionId.localeCompare(right.questionId);
  });
}

export function deriveDropoffRankReviews(input: {
  runs: PersistedRun[];
  questionSignals: PersistedQuestionBehaviorSignal[];
}) {
  const signalsByRunId = input.questionSignals.reduce<Map<string, PersistedQuestionBehaviorSignal[]>>((accumulator, signal) => {
    const current = accumulator.get(signal.runId) ?? [];
    current.push(signal);
    accumulator.set(signal.runId, current);
    return accumulator;
  }, new Map());

  const eliminatedRuns = input.runs.filter((run) => run.outcome === "eliminated");
  const rankBuckets = new Map<
    number,
    {
      endings: number;
      timeoutEndings: number;
      categories: string[];
    }
  >();

  for (const run of eliminatedRuns) {
    const orderedSignals = (signalsByRunId.get(run.id) ?? []).slice().sort((left, right) => left.questionRank - right.questionRank);
    const finalSignal = orderedSignals.at(-1);

    if (!finalSignal) {
      continue;
    }

    const current = rankBuckets.get(finalSignal.questionRank) ?? {
      endings: 0,
      timeoutEndings: 0,
      categories: []
    };

    current.endings += 1;
    current.timeoutEndings += finalSignal.result === "timeout" ? 1 : 0;
    current.categories.push(finalSignal.category);
    rankBuckets.set(finalSignal.questionRank, current);
  }

  const reviews = [...rankBuckets.entries()].map<DropoffRankReview>(([rank, bucket]) => {
    const endings = bucket.endings;
    const endingRate = eliminatedRuns.length === 0 ? 0 : roundRate(endings / eliminatedRuns.length);
    const timeoutRate = endings === 0 ? 0 : roundRate(bucket.timeoutEndings / endings);
    const categoryCounts = bucket.categories.reduce<Record<string, number>>((accumulator, category) => {
      accumulator[category] = (accumulator[category] ?? 0) + 1;
      return accumulator;
    }, {});
    const dominantCategory =
      Object.entries(categoryCounts).sort((left, right) => {
        if (left[1] !== right[1]) {
          return right[1] - left[1];
        }

        return left[0].localeCompare(right[0]);
      })[0]?.[0] ?? null;

    return {
      rank,
      endings,
      endingRate,
      timeoutEndings: bucket.timeoutEndings,
      timeoutRate,
      dominantCategory,
      status: getDropoffStatus({
        eliminatedRunsObserved: eliminatedRuns.length,
        endings,
        endingRate,
        timeoutRate
      }),
      confidence:
        eliminatedRuns.length < ADMIN_INTELLIGENCE_THRESHOLDS.minimumDropoffRuns
          ? "low"
          : endings >= 2
            ? "high"
            : "medium"
    };
  });

  return reviews.sort((left, right) => {
    if (left.endings !== right.endings) {
      return right.endings - left.endings;
    }

    return left.rank - right.rank;
  });
}

function getDifficultyIndex(difficultyBand: DifficultyBand) {
  const bands: DifficultyBand[] = ["easy", "medium", "hard"];
  return bands.indexOf(difficultyBand);
}

export function deriveAdaptationFairnessReview(input: {
  questionSignals: PersistedQuestionBehaviorSignal[];
  questions: ContentQuestion[];
}) {
  const metadataByQuestionId = buildQuestionMetadataMap(input.questions);
  const signalsByRunId = input.questionSignals.reduce<Map<string, PersistedQuestionBehaviorSignal[]>>((accumulator, signal) => {
    const current = accumulator.get(signal.runId) ?? [];
    current.push(signal);
    accumulator.set(signal.runId, current);
    return accumulator;
  }, new Map());

  let transitionsObserved = 0;
  let transitionsWithMetadata = 0;
  let harshPressureRebounds = 0;
  let timeoutPressureRebounds = 0;
  let repeatedCategoryRebounds = 0;
  let difficultyLeaps = 0;

  for (const orderedSignals of signalsByRunId.values()) {
    const runSignals = orderedSignals.slice().sort((left, right) => left.questionRank - right.questionRank);

    for (let index = 1; index < runSignals.length; index += 1) {
      const previous = runSignals[index - 1];
      const current = runSignals[index];
      const previousMetadata = metadataByQuestionId.get(previous.questionId) ?? null;
      const currentMetadata = metadataByQuestionId.get(current.questionId) ?? null;

      transitionsObserved += 1;

      if (currentMetadata && previousMetadata) {
        transitionsWithMetadata += 1;
      }

      if (previous.result !== "correct" && currentMetadata?.pressureTag === "spiky") {
        harshPressureRebounds += 1;
      }

      if (previous.result === "timeout" && currentMetadata?.pressureTag === "spiky") {
        timeoutPressureRebounds += 1;
      }

      if (previous.result !== "correct" && previous.category === current.category) {
        repeatedCategoryRebounds += 1;
      }

      if (previousMetadata && currentMetadata) {
        const difficultyDistance = Math.abs(
          getDifficultyIndex(previousMetadata.difficultyBand) - getDifficultyIndex(currentMetadata.difficultyBand)
        );

        if (difficultyDistance >= ADMIN_INTELLIGENCE_THRESHOLDS.difficultyLeapDistance) {
          difficultyLeaps += 1;
        }
      }
    }
  }

  const harshRate = transitionsObserved === 0 ? 0 : roundRate(harshPressureRebounds / transitionsObserved);
  const repeatedCategoryRate =
    transitionsObserved === 0 ? 0 : roundRate(repeatedCategoryRebounds / transitionsObserved);
  const confidence: AdminSignalConfidence =
    transitionsObserved < ADMIN_INTELLIGENCE_THRESHOLDS.minimumAdaptationTransitions
      ? "low"
      : transitionsWithMetadata === transitionsObserved
        ? "high"
        : "medium";
  const notes: AdaptationFairnessReview["notes"] = [];

  if (harshPressureRebounds > 0) {
    notes.push("spiky-after-miss");
  }

  if (timeoutPressureRebounds > 0) {
    notes.push("spiky-after-timeout");
  }

  if (repeatedCategoryRebounds > 0) {
    notes.push("repeated-category-rebound");
  }

  if (difficultyLeaps > 0) {
    notes.push("difficulty-leap");
  }

  return {
    transitionsObserved,
    transitionsWithMetadata,
    harshPressureRebounds,
    timeoutPressureRebounds,
    repeatedCategoryRebounds,
    difficultyLeaps,
    status: getAdaptationStatus({
      transitionsObserved,
      harshRate,
      repeatedCategoryRate,
      difficultyLeaps
    }),
    confidence,
    notes
  };
}

export function buildAdminIntelligenceReport(input: {
  runs: PersistedRun[];
  questionSignals: PersistedQuestionBehaviorSignal[];
  questions: ContentQuestion[];
  playerModels?: PersistedPlayerModel[];
}) {
  const questionReviews = deriveQuestionCalibrationReviews({
    questionSignals: input.questionSignals,
    questions: input.questions
  });
  const dropoffRanks = deriveDropoffRankReviews({
    runs: input.runs,
    questionSignals: input.questionSignals
  });
  const adaptationFairness = deriveAdaptationFairnessReview({
    questionSignals: input.questionSignals,
    questions: input.questions
  });

  return {
    summary: {
      runsObserved: input.runs.length,
      eliminatedRunsObserved: input.runs.filter((run) => run.outcome === "eliminated").length,
      questionSignalsObserved: input.questionSignals.length,
      questionReviewsProduced: questionReviews.length,
      playerModelsObserved: input.playerModels?.length ?? 0
    },
    questionReviews,
    dropoffRanks,
    adaptationFairness
  } satisfies AdminIntelligenceReport;
}
