import type { DifficultyBand, PressureTag, Question } from "./game.ts";
import type { PlayerModelSnapshot } from "./player-model.ts";

export const ADAPTIVE_ENGINE_RULES = {
  minimumQuestionsForAdaptation: 6,
  minimumCategoryQuestionsForWeakSpot: 3,
  recentTimeoutLookback: 2,
  recentMissPressureCooldownLookback: 1,
  difficultyBandWindow: 1,
  maxRecentCategoryRepeats: 1,
  freshnessQuestionPenalty: 100,
  freshnessCategoryPenalty: 24,
  wrongAnswerRecoveryDifficultyShift: -1,
  timeoutRecoveryDifficultyShift: -1,
  steadyPressureDifficultyShift: 1,
  highSkillAccuracyRate: 0.78,
  highSkillTimeoutRate: 0.12,
  strugglingAccuracyRate: 0.52,
  strugglingTimeoutRate: 0.26,
  maxModelDifficultyShift: 1,
  difficultyFitReward: 24,
  pressureFitReward: 16,
  weakSpotReward: 8
} as const;

export type AdaptiveRunContext = {
  currentRank: number;
  recentResults: Array<"correct" | "incorrect" | "timeout">;
  recentCategories: string[];
  recentlySeenQuestionIds: string[];
};

export type AdaptiveCandidateScore = {
  questionId: string;
  totalScore: number;
  difficultyScore: number;
  pressureScore: number;
  weakSpotScore: number;
  freshnessPenalty: number;
};

export type AdaptiveSelectionResult = {
  chosenQuestionId: string;
  targetDifficultyBand: DifficultyBand;
  lowConfidenceFallback: boolean;
  rankedCandidates: AdaptiveCandidateScore[];
};

const DIFFICULTY_ORDER: DifficultyBand[] = ["easy", "medium", "hard"];

function clampDifficultyIndex(value: number) {
  return Math.max(0, Math.min(DIFFICULTY_ORDER.length - 1, value));
}

function getDifficultyIndex(band: DifficultyBand) {
  return DIFFICULTY_ORDER.indexOf(band);
}

function getBaselineDifficultyBand(rank: number): DifficultyBand {
  if (rank <= 4) {
    return "easy";
  }

  if (rank <= 8) {
    return "medium";
  }

  return "hard";
}

function shiftDifficultyBand(band: DifficultyBand, shift: number) {
  return DIFFICULTY_ORDER[clampDifficultyIndex(getDifficultyIndex(band) + shift)];
}

export function isLowConfidenceAdaptationModel(model: PlayerModelSnapshot | null) {
  if (!model) {
    return true;
  }

  return (
    model.questionsObserved < ADAPTIVE_ENGINE_RULES.minimumQuestionsForAdaptation ||
    model.confidenceStyle === "insufficient-data" ||
    model.hesitationStyle === "insufficient-data" ||
    model.pressureStyle === "insufficient-data"
  );
}

function getWeakSpotCategory(model: PlayerModelSnapshot | null) {
  if (!model) {
    return null;
  }

  const eligible = Object.entries(model.categorySnapshot).filter(
    ([, snapshot]) => snapshot.questions >= ADAPTIVE_ENGINE_RULES.minimumCategoryQuestionsForWeakSpot
  );

  if (eligible.length === 0) {
    return null;
  }

  eligible.sort((left, right) => {
    const [leftCategory, leftSnapshot] = left;
    const [rightCategory, rightSnapshot] = right;
    const leftScore = leftSnapshot.accuracyRate - leftSnapshot.timeoutRate;
    const rightScore = rightSnapshot.accuracyRate - rightSnapshot.timeoutRate;

    if (leftScore !== rightScore) {
      return leftScore - rightScore;
    }

    return leftCategory.localeCompare(rightCategory);
  });

  return eligible[0]?.[0] ?? null;
}

function hasRecentTimeout(context: AdaptiveRunContext) {
  return context.recentResults.slice(-ADAPTIVE_ENGINE_RULES.recentTimeoutLookback).includes("timeout");
}

function hasRecentIncorrect(context: AdaptiveRunContext) {
  return context.recentResults.slice(-ADAPTIVE_ENGINE_RULES.recentMissPressureCooldownLookback).includes("incorrect");
}

function getTargetDifficultyBand(model: PlayerModelSnapshot | null, context: AdaptiveRunContext) {
  const baseline = getBaselineDifficultyBand(context.currentRank);

  if (isLowConfidenceAdaptationModel(model)) {
    return baseline;
  }

  if (!model) {
    return baseline;
  }

  const confidentModel = model;
  const lastResult = context.recentResults.at(-1) ?? null;

  if (lastResult === "incorrect") {
    return shiftDifficultyBand(baseline, ADAPTIVE_ENGINE_RULES.wrongAnswerRecoveryDifficultyShift);
  }

  if (lastResult === "timeout" || hasRecentTimeout(context)) {
    return shiftDifficultyBand(baseline, ADAPTIVE_ENGINE_RULES.timeoutRecoveryDifficultyShift);
  }

  let modelShift = 0;

  if (
    confidentModel.accuracyRate >= ADAPTIVE_ENGINE_RULES.highSkillAccuracyRate &&
    confidentModel.timeoutRate <= ADAPTIVE_ENGINE_RULES.highSkillTimeoutRate
  ) {
    modelShift += 1;
  }

  if (
    confidentModel.accuracyRate <= ADAPTIVE_ENGINE_RULES.strugglingAccuracyRate ||
    confidentModel.timeoutRate >= ADAPTIVE_ENGINE_RULES.strugglingTimeoutRate
  ) {
    modelShift -= 1;
  }

  if (confidentModel.pressureStyle === "steady-under-pressure" && confidentModel.confidenceStyle === "decisive") {
    modelShift = Math.max(modelShift, ADAPTIVE_ENGINE_RULES.steadyPressureDifficultyShift);
  }

  if (confidentModel.pressureStyle === "timeout-prone") {
    modelShift = Math.min(modelShift, ADAPTIVE_ENGINE_RULES.timeoutRecoveryDifficultyShift);
  }

  const boundedShift = Math.max(
    -ADAPTIVE_ENGINE_RULES.maxModelDifficultyShift,
    Math.min(ADAPTIVE_ENGINE_RULES.maxModelDifficultyShift, modelShift)
  );

  return shiftDifficultyBand(baseline, boundedShift);
}

function isAllowedPressureTag(model: PlayerModelSnapshot | null, context: AdaptiveRunContext, pressureTag: PressureTag) {
  if (!model || isLowConfidenceAdaptationModel(model)) {
    return true;
  }

  if (model.pressureStyle === "timeout-prone" && pressureTag === "spiky") {
    return false;
  }

  if (hasRecentTimeout(context) && pressureTag === "spiky") {
    return false;
  }

  if (hasRecentIncorrect(context) && pressureTag === "spiky") {
    return false;
  }

  return true;
}

function violatesCategoryGuardrail(context: AdaptiveRunContext, category: string) {
  const recentMatches = context.recentCategories.filter((recentCategory) => recentCategory === category).length;
  return recentMatches > ADAPTIVE_ENGINE_RULES.maxRecentCategoryRepeats;
}

function scoreDifficultyFit(targetBand: DifficultyBand, candidateBand: DifficultyBand) {
  const distance = Math.abs(getDifficultyIndex(targetBand) - getDifficultyIndex(candidateBand));
  if (distance > ADAPTIVE_ENGINE_RULES.difficultyBandWindow) {
    return Number.NEGATIVE_INFINITY;
  }

  return ADAPTIVE_ENGINE_RULES.difficultyFitReward - distance * 10;
}

function scorePressureFit(model: PlayerModelSnapshot | null, pressureTag: PressureTag) {
  if (!model || isLowConfidenceAdaptationModel(model)) {
    return pressureTag === "neutral" ? ADAPTIVE_ENGINE_RULES.pressureFitReward : ADAPTIVE_ENGINE_RULES.pressureFitReward - 4;
  }

  if (model.pressureStyle === "timeout-prone") {
    return pressureTag === "calm" ? ADAPTIVE_ENGINE_RULES.pressureFitReward : pressureTag === "neutral" ? 8 : -12;
  }

  if (model.pressureStyle === "steady-under-pressure") {
    return pressureTag === "spiky" ? ADAPTIVE_ENGINE_RULES.pressureFitReward : pressureTag === "neutral" ? 9 : 3;
  }

  return pressureTag === "neutral" ? ADAPTIVE_ENGINE_RULES.pressureFitReward : 6;
}

function scoreWeakSpot(model: PlayerModelSnapshot | null, context: AdaptiveRunContext, category: string) {
  if (isLowConfidenceAdaptationModel(model)) {
    return 0;
  }

  const weakSpotCategory = getWeakSpotCategory(model);

  if (!weakSpotCategory || weakSpotCategory !== category) {
    return 0;
  }

  if (context.recentCategories.includes(category)) {
    return 1;
  }

  return ADAPTIVE_ENGINE_RULES.weakSpotReward;
}

function scoreFreshness(context: AdaptiveRunContext, candidate: Question) {
  let penalty = 0;

  if (context.recentlySeenQuestionIds.includes(candidate.id)) {
    penalty += ADAPTIVE_ENGINE_RULES.freshnessQuestionPenalty;
  }

  const categoryRepeats = context.recentCategories.filter((category) => category === candidate.category).length;
  penalty += categoryRepeats * ADAPTIVE_ENGINE_RULES.freshnessCategoryPenalty;

  return penalty;
}

export function chooseAdaptiveQuestion(input: {
  playerModel: PlayerModelSnapshot | null;
  runContext: AdaptiveRunContext;
  candidates: Question[];
}) {
  const { playerModel, runContext, candidates } = input;

  if (candidates.length === 0) {
    throw new Error("Adaptive engine requires at least one candidate question.");
  }

  const lowConfidenceFallback = isLowConfidenceAdaptationModel(playerModel);
  const targetDifficultyBand = getTargetDifficultyBand(playerModel, runContext);

  const rankedCandidates = candidates
    .filter((candidate) => !violatesCategoryGuardrail(runContext, candidate.category))
    .filter((candidate) => isAllowedPressureTag(playerModel, runContext, candidate.pressureTag))
    .map<AdaptiveCandidateScore | null>((candidate) => {
      const difficultyScore = scoreDifficultyFit(targetDifficultyBand, candidate.difficultyBand);

      if (!Number.isFinite(difficultyScore)) {
        return null;
      }

      const pressureScore = scorePressureFit(playerModel, candidate.pressureTag);
      const weakSpotScore = scoreWeakSpot(playerModel, runContext, candidate.category);
      const freshnessPenalty = scoreFreshness(runContext, candidate);

      return {
        questionId: candidate.id,
        totalScore: difficultyScore + pressureScore + weakSpotScore - freshnessPenalty,
        difficultyScore,
        pressureScore,
        weakSpotScore,
        freshnessPenalty
      };
    })
    .filter((candidate): candidate is AdaptiveCandidateScore => candidate !== null)
    .sort((left, right) => {
      if (left.totalScore !== right.totalScore) {
        return right.totalScore - left.totalScore;
      }

      if (left.freshnessPenalty !== right.freshnessPenalty) {
        return left.freshnessPenalty - right.freshnessPenalty;
      }

      return left.questionId.localeCompare(right.questionId);
    });

  const fallbackCandidates = candidates
    .map((candidate) => ({
      questionId: candidate.id,
      totalScore: 0,
      difficultyScore: 0,
      pressureScore: 0,
      weakSpotScore: 0,
      freshnessPenalty: scoreFreshness(runContext, candidate)
    }))
    .sort((left, right) => {
      if (left.freshnessPenalty !== right.freshnessPenalty) {
        return left.freshnessPenalty - right.freshnessPenalty;
      }

      return left.questionId.localeCompare(right.questionId);
    });

  const finalCandidates = rankedCandidates.length > 0 ? rankedCandidates : fallbackCandidates;

  return {
    chosenQuestionId: finalCandidates[0].questionId,
    targetDifficultyBand,
    lowConfidenceFallback,
    rankedCandidates: finalCandidates
  } satisfies AdaptiveSelectionResult;
}
