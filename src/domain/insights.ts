import type { FailureReason, RunOutcome } from "./game.ts";
import {
  PLAYER_MODEL_THRESHOLDS,
  type PlayerModelSnapshot,
  type QuestionBehaviorSignal,
  type RunBehaviorSummary
} from "./player-model.ts";

export const INSIGHT_RULES = {
  minimumRunQuestionsForGeneralizedInsights: 3,
  minimumCategoryQuestionsForRunInsight: 2,
  minimumPrimaryScore: 7,
  minimumSecondaryScore: 6,
  contradictionPenalty: 4,
  categoryWeakAccuracyThreshold: 0.45,
  categoryWeakTimeoutThreshold: 0.34,
  decisiveSelectionChangeRate: 0.25,
  waveringSelectionChangeRate: 0.9,
  fastRunFirstSelectionMs: PLAYER_MODEL_THRESHOLDS.fastReaderFirstSelectionMs,
  lateRunResponseMs: PLAYER_MODEL_THRESHOLDS.lateCommitterResponseMs
} as const;

export type InsightFamily =
  | "pressure-read"
  | "confidence-read"
  | "weak-spot-read"
  | "ending-pattern-read";

export type InsightStrength = "strong" | "softened";
export type InsightConfidence = "high" | "medium";

export type InsightResultContext = {
  outcome: RunOutcome;
  failureReason: FailureReason | null;
  highestRank: number;
  correctAnswers: number;
  totalQuestions: number;
};

export type InsightSummaryItem = {
  family: InsightFamily;
  strength: InsightStrength;
  confidence: InsightConfidence;
  text: string;
  evidenceScore: number;
};

export type InsightSummaryPayload = {
  primary: InsightSummaryItem | null;
  secondary: InsightSummaryItem | null;
};

type InsightCandidate = InsightSummaryItem & {
  contradictionPenalty: number;
};

const FAMILY_PRIORITY: InsightFamily[] = [
  "ending-pattern-read",
  "pressure-read",
  "confidence-read",
  "weak-spot-read"
];

function getFamilyPriority(family: InsightFamily) {
  return FAMILY_PRIORITY.indexOf(family);
}

function createCandidate(input: {
  family: InsightFamily;
  baseScore: number;
  contradictionPenalty?: number;
  text: string;
}) {
  const contradictionPenalty = input.contradictionPenalty ?? 0;
  const evidenceScore = Math.max(input.baseScore - contradictionPenalty, 0);

  if (evidenceScore <= 0) {
    return null;
  }

  const candidate: InsightCandidate = {
    family: input.family,
    text: input.text,
    contradictionPenalty,
    evidenceScore,
    strength: evidenceScore >= 8 ? "strong" : "softened",
    confidence: evidenceScore >= 8 ? "high" : "medium"
  };

  return candidate;
}

function sortCandidates(left: InsightCandidate, right: InsightCandidate) {
  if (left.evidenceScore !== right.evidenceScore) {
    return right.evidenceScore - left.evidenceScore;
  }

  if (left.contradictionPenalty !== right.contradictionPenalty) {
    return left.contradictionPenalty - right.contradictionPenalty;
  }

  return getFamilyPriority(left.family) - getFamilyPriority(right.family);
}

function getLastSignal(questionSignals: QuestionBehaviorSignal[]) {
  return questionSignals.at(-1) ?? null;
}

function getWeakRunCategory(
  runSummary: RunBehaviorSummary,
  playerModel: PlayerModelSnapshot | null
) {
  const categories = Object.entries(runSummary.categoryBreakdown).filter(
    ([, summary]) => summary.questions >= INSIGHT_RULES.minimumCategoryQuestionsForRunInsight
  );

  if (categories.length === 0) {
    return null;
  }

  categories.sort((left, right) => {
    const [leftCategory, leftSummary] = left;
    const [rightCategory, rightSummary] = right;
    const leftAccuracy = leftSummary.correctCount / leftSummary.questions;
    const rightAccuracy = rightSummary.correctCount / rightSummary.questions;
    const leftTimeout = leftSummary.timeoutCount / leftSummary.questions;
    const rightTimeout = rightSummary.timeoutCount / rightSummary.questions;
    const leftScore = leftAccuracy - leftTimeout;
    const rightScore = rightAccuracy - rightTimeout;

    if (leftScore !== rightScore) {
      return leftScore - rightScore;
    }

    const leftModel = playerModel?.categorySnapshot[leftCategory];
    const rightModel = playerModel?.categorySnapshot[rightCategory];
    const leftModelScore = leftModel ? leftModel.accuracyRate - leftModel.timeoutRate : Number.POSITIVE_INFINITY;
    const rightModelScore = rightModel ? rightModel.accuracyRate - rightModel.timeoutRate : Number.POSITIVE_INFINITY;

    if (leftModelScore !== rightModelScore) {
      return leftModelScore - rightModelScore;
    }

    return leftCategory.localeCompare(rightCategory);
  });

  return categories[0] ?? null;
}

function derivePressureCandidate(input: {
  runSummary: RunBehaviorSummary;
  playerModel: PlayerModelSnapshot | null;
  resultContext: InsightResultContext;
}) {
  const { runSummary, playerModel, resultContext } = input;

  if (runSummary.correctCount + runSummary.incorrectCount + runSummary.timeoutCount < INSIGHT_RULES.minimumRunQuestionsForGeneralizedInsights) {
    return null;
  }

  const pressureSensitiveModel =
    playerModel?.pressureStyle === "pressure-sensitive" || playerModel?.pressureStyle === "timeout-prone";
  const steadyModel = playerModel?.pressureStyle === "steady-under-pressure";

  if (
    resultContext.failureReason === "timeout" &&
    (pressureSensitiveModel || runSummary.pressureMissCount >= 1 || runSummary.timeoutCount >= 1)
  ) {
    return createCandidate({
      family: "pressure-read",
      baseScore: 9,
      contradictionPenalty: steadyModel ? INSIGHT_RULES.contradictionPenalty : 0,
      text: "The clock broke this run before certainty did."
    });
  }

  if (runSummary.pressureMissCount >= 2) {
    return createCandidate({
      family: "pressure-read",
      baseScore: 8,
      contradictionPenalty: steadyModel ? INSIGHT_RULES.contradictionPenalty : 0,
      text: "This run got shaky when the clock narrowed."
    });
  }

  if (
    runSummary.under5sLockCount >= 2 &&
    runSummary.pressureMissCount === 0 &&
    (steadyModel || playerModel?.pressureAccuracyRate === undefined || playerModel.pressureAccuracyRate >= 0.6)
  ) {
    return createCandidate({
      family: "pressure-read",
      baseScore: 8,
      contradictionPenalty: pressureSensitiveModel ? INSIGHT_RULES.contradictionPenalty : 0,
      text: "You stayed clear even when the clock narrowed."
    });
  }

  return null;
}

function deriveConfidenceCandidate(input: {
  runSummary: RunBehaviorSummary;
  playerModel: PlayerModelSnapshot | null;
}) {
  const { runSummary, playerModel } = input;

  const totalQuestions = runSummary.correctCount + runSummary.incorrectCount + runSummary.timeoutCount;

  if (totalQuestions < INSIGHT_RULES.minimumRunQuestionsForGeneralizedInsights) {
    return null;
  }

  if (
    runSummary.selectionChangeRate <= INSIGHT_RULES.decisiveSelectionChangeRate &&
    (runSummary.averageFirstSelectionTimeMs ?? 0) > 0 &&
    (runSummary.averageFirstSelectionTimeMs ?? 0) <= INSIGHT_RULES.fastRunFirstSelectionMs
  ) {
    const contradictionPenalty =
      playerModel?.confidenceStyle === "wavering" ? INSIGHT_RULES.contradictionPenalty : 0;

    return createCandidate({
      family: "confidence-read",
      baseScore: 8,
      contradictionPenalty,
      text: "You committed cleanly and rarely looked back."
    });
  }

  if (
    runSummary.selectionChangeRate >= INSIGHT_RULES.waveringSelectionChangeRate ||
    (runSummary.averageResponseTimeMs >= INSIGHT_RULES.lateRunResponseMs &&
      (runSummary.averageFirstSelectionTimeMs ?? runSummary.averageResponseTimeMs) > INSIGHT_RULES.fastRunFirstSelectionMs)
  ) {
    const contradictionPenalty =
      playerModel?.confidenceStyle === "decisive" ? INSIGHT_RULES.contradictionPenalty : 0;

    return createCandidate({
      family: "confidence-read",
      baseScore: 7,
      contradictionPenalty,
      text:
        runSummary.selectionChangeRate >= INSIGHT_RULES.waveringSelectionChangeRate
          ? "This run got expensive when your reads started to drift."
          : "You read carefully, but the late decisions cost you pace."
    });
  }

  return null;
}

function deriveWeakSpotCandidate(input: {
  runSummary: RunBehaviorSummary;
  playerModel: PlayerModelSnapshot | null;
}) {
  const weakRunCategory = getWeakRunCategory(input.runSummary, input.playerModel);

  if (!weakRunCategory) {
    return null;
  }

  const [category, summary] = weakRunCategory;
  const runAccuracy = summary.correctCount / summary.questions;
  const runTimeoutRate = summary.timeoutCount / summary.questions;
  const snapshot = input.playerModel?.categorySnapshot[category] ?? null;
  const alignedWithModel =
    snapshot !== null &&
    (snapshot.accuracyRate <= INSIGHT_RULES.categoryWeakAccuracyThreshold ||
      snapshot.timeoutRate >= INSIGHT_RULES.categoryWeakTimeoutThreshold);

  if (
    runAccuracy <= INSIGHT_RULES.categoryWeakAccuracyThreshold ||
    runTimeoutRate >= INSIGHT_RULES.categoryWeakTimeoutThreshold
  ) {
    return createCandidate({
      family: "weak-spot-read",
      baseScore: alignedWithModel ? 8 : 6,
      text: alignedWithModel
        ? `${category} slowed you down before it beat you.`
        : `${category} looked less certain than the rest of the board.`
    });
  }

  return null;
}

function deriveEndingPatternCandidate(input: {
  questionSignals: QuestionBehaviorSignal[];
  playerModel: PlayerModelSnapshot | null;
  resultContext: InsightResultContext;
}) {
  const { questionSignals, playerModel, resultContext } = input;

  if (questionSignals.length < INSIGHT_RULES.minimumRunQuestionsForGeneralizedInsights) {
    return null;
  }

  const lastSignal = getLastSignal(questionSignals);

  if (!lastSignal) {
    return null;
  }

  if (resultContext.failureReason === "timeout") {
    return createCandidate({
      family: "ending-pattern-read",
      baseScore: 9,
      contradictionPenalty:
        playerModel?.pressureStyle === "steady-under-pressure" ? INSIGHT_RULES.contradictionPenalty : 0,
      text: "The run ended on time pressure, not a lack of reads."
    });
  }

  if (
    resultContext.failureReason === "wrong-answer" &&
    lastSignal.lockedAnswerIndex !== null &&
    lastSignal.selectionChangeCount === 0 &&
    lastSignal.responseTimeMs <= INSIGHT_RULES.fastRunFirstSelectionMs * 2
  ) {
    return createCandidate({
      family: "ending-pattern-read",
      baseScore: 8,
      contradictionPenalty:
        playerModel?.confidenceStyle === "wavering" ? INSIGHT_RULES.contradictionPenalty : 0,
      text: "The break came from certainty, not hesitation."
    });
  }

  if (resultContext.outcome === "completed") {
    return createCandidate({
      family: "ending-pattern-read",
      baseScore: 7,
      text: "You closed the run without giving the clock a way in."
    });
  }

  return null;
}

export function deriveInsightCandidates(input: {
  runSummary: RunBehaviorSummary;
  questionSignals: QuestionBehaviorSignal[];
  playerModel: PlayerModelSnapshot | null;
  resultContext: InsightResultContext;
}) {
  const candidates = [
    derivePressureCandidate(input),
    deriveConfidenceCandidate(input),
    deriveWeakSpotCandidate(input),
    deriveEndingPatternCandidate(input)
  ]
    .filter((candidate): candidate is InsightCandidate => candidate !== null)
    .sort(sortCandidates);

  return candidates;
}

export function deriveInsightSummary(input: {
  runSummary: RunBehaviorSummary;
  questionSignals: QuestionBehaviorSignal[];
  playerModel: PlayerModelSnapshot | null;
  resultContext: InsightResultContext;
}) {
  const candidates = deriveInsightCandidates(input);

  const primary = candidates.find((candidate) => candidate.evidenceScore >= INSIGHT_RULES.minimumPrimaryScore) ?? null;
  const secondary =
    candidates.find(
      (candidate) =>
        primary !== null &&
        candidate.family !== primary.family &&
        candidate.evidenceScore >= INSIGHT_RULES.minimumSecondaryScore &&
        primary.evidenceScore - candidate.evidenceScore <= 2
    ) ?? null;

  return {
    primary,
    secondary
  } satisfies InsightSummaryPayload;
}
