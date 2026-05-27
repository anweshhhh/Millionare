import type { AnswerRecord } from "./game.ts";

export const PLAYER_MODEL_THRESHOLDS = {
  minimumQuestionsForStyle: 6,
  minimumPressureEventsForPressureStyle: 2,
  decisiveAccuracyRate: 0.72,
  decisiveSelectionChangeRate: 0.35,
  waveringSelectionChangeRate: 0.9,
  waveringAccuracyRate: 0.45,
  fastReaderFirstSelectionMs: 4_500,
  lateCommitterResponseMs: 13_000,
  steadyPressureAccuracyRate: 0.6,
  steadyPressureTimeoutRate: 0.15,
  timeoutPronePressureTimeoutRate: 0.34
} as const;

export type QuestionBehaviorSignal = {
  questionId: string;
  questionRank: number;
  category: string;
  result: AnswerRecord["result"];
  correctAnswerIndex: number;
  selectedAnswerIndex: number | null;
  lockedAnswerIndex: number | null;
  responseTimeMs: number;
  firstSelectionTimeMs: number | null;
  selectionChangeCount: number;
  timeRemainingAtLock: number | null;
  lockedWithUnder5s: boolean;
  timedOutWithoutLock: boolean;
};

export type CategoryBehaviorSummary = {
  questions: number;
  correctCount: number;
  timeoutCount: number;
  averageResponseTimeMs: number;
};

export type RunBehaviorSummary = {
  correctCount: number;
  incorrectCount: number;
  timeoutCount: number;
  averageResponseTimeMs: number;
  averageFirstSelectionTimeMs: number | null;
  selectionChangeRate: number;
  under5sLockCount: number;
  pressureMissCount: number;
  categoryBreakdown: Record<string, CategoryBehaviorSummary>;
};

export type PlayerModelStyle =
  | "decisive"
  | "measured"
  | "wavering"
  | "fast-reader"
  | "deliberate-reader"
  | "late-committer"
  | "steady-under-pressure"
  | "pressure-sensitive"
  | "timeout-prone"
  | "insufficient-data";

export type CategoryModelSnapshot = {
  questions: number;
  accuracyRate: number;
  timeoutRate: number;
  averageResponseTimeMs: number;
};

export type PlayerModelSnapshot = {
  runsObserved: number;
  questionsObserved: number;
  accuracyRate: number;
  timeoutRate: number;
  avgResponseTimeMs: number | null;
  avgFirstSelectionTimeMs: number | null;
  avgSelectionChangeCount: number;
  pressureAccuracyRate: number;
  pressureTimeoutRate: number;
  confidenceStyle: PlayerModelStyle;
  hesitationStyle: PlayerModelStyle;
  pressureStyle: PlayerModelStyle;
  categorySnapshot: Record<string, CategoryModelSnapshot>;
  modelVersion: string;
};

export type TransientQuestionCapture = {
  questionId: string;
  questionRank: number;
  category: string;
  activatedAtMs: number;
  firstSelectionAtMs: number | null;
  selectionChangeCount: number;
  latestSelectedAnswerIndex: number | null;
  lockedAtMs: number | null;
  lockedAnswerIndex: number | null;
  timeRemainingAtLock: number | null;
};

export function createTransientQuestionCapture(input: {
  questionId: string;
  questionRank: number;
  category: string;
  activatedAtMs: number;
}) {
  const capture: TransientQuestionCapture = {
    questionId: input.questionId,
    questionRank: input.questionRank,
    category: input.category,
    activatedAtMs: input.activatedAtMs,
    firstSelectionAtMs: null,
    selectionChangeCount: 0,
    latestSelectedAnswerIndex: null,
    lockedAtMs: null,
    lockedAnswerIndex: null,
    timeRemainingAtLock: null
  };

  return capture;
}

export function recordSelection(
  capture: TransientQuestionCapture,
  input: {
    answerIndex: number;
    selectedAtMs: number;
  }
) {
  const isFirstSelection = capture.firstSelectionAtMs === null;
  const isChangedSelection =
    capture.latestSelectedAnswerIndex !== null && capture.latestSelectedAnswerIndex !== input.answerIndex;

  return {
    ...capture,
    firstSelectionAtMs: isFirstSelection ? input.selectedAtMs : capture.firstSelectionAtMs,
    selectionChangeCount: capture.selectionChangeCount + (isChangedSelection ? 1 : 0),
    latestSelectedAnswerIndex: input.answerIndex
  };
}

export function recordLock(
  capture: TransientQuestionCapture,
  input: {
    lockedAnswerIndex: number;
    lockedAtMs: number;
    timeRemainingAtLock: number;
  }
) {
  return {
    ...capture,
    lockedAtMs: input.lockedAtMs,
    lockedAnswerIndex: input.lockedAnswerIndex,
    timeRemainingAtLock: input.timeRemainingAtLock
  };
}

export function finalizeQuestionBehaviorSignal(
  capture: TransientQuestionCapture,
  input: {
    result: AnswerRecord["result"];
    correctAnswerIndex: number;
    selectedAnswerIndex: number | null;
    lockedAnswerIndex: number | null;
    resolvedAtMs: number;
  }
) {
  const responseEndedAtMs = capture.lockedAtMs ?? input.resolvedAtMs;
  const responseTimeMs = Math.max(responseEndedAtMs - capture.activatedAtMs, 0);
  const firstSelectionTimeMs =
    capture.firstSelectionAtMs === null ? null : Math.max(capture.firstSelectionAtMs - capture.activatedAtMs, 0);

  const signal: QuestionBehaviorSignal = {
    questionId: capture.questionId,
    questionRank: capture.questionRank,
    category: capture.category,
    result: input.result,
    correctAnswerIndex: input.correctAnswerIndex,
    selectedAnswerIndex: input.selectedAnswerIndex,
    lockedAnswerIndex: input.lockedAnswerIndex,
    responseTimeMs,
    firstSelectionTimeMs,
    selectionChangeCount: capture.selectionChangeCount,
    timeRemainingAtLock: capture.timeRemainingAtLock,
    lockedWithUnder5s: capture.timeRemainingAtLock !== null && capture.timeRemainingAtLock < 5,
    timedOutWithoutLock: input.result === "timeout" && input.lockedAnswerIndex === null
  };

  return signal;
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function buildRunBehaviorSummary(signals: QuestionBehaviorSignal[]) {
  const correctCount = signals.filter((signal) => signal.result === "correct").length;
  const incorrectCount = signals.filter((signal) => signal.result === "incorrect").length;
  const timeoutCount = signals.filter((signal) => signal.result === "timeout").length;
  const averageResponseTimeMs = average(signals.map((signal) => signal.responseTimeMs)) ?? 0;
  const firstSelectionTimes = signals
    .map((signal) => signal.firstSelectionTimeMs)
    .filter((value): value is number => value !== null);
  const averageFirstSelectionTimeMs = average(firstSelectionTimes);
  const totalSelectionChanges = signals.reduce((sum, signal) => sum + signal.selectionChangeCount, 0);
  const under5sLockCount = signals.filter((signal) => signal.lockedWithUnder5s).length;
  const pressureMissCount = signals.filter((signal) => signal.lockedWithUnder5s && signal.result !== "correct").length;

  const categoryBreakdown = signals.reduce<Record<string, CategoryBehaviorSummary>>((accumulator, signal) => {
    const current = accumulator[signal.category] ?? {
      questions: 0,
      correctCount: 0,
      timeoutCount: 0,
      averageResponseTimeMs: 0
    };

    const questions = current.questions + 1;
    const totalResponseTime = current.averageResponseTimeMs * current.questions + signal.responseTimeMs;

    accumulator[signal.category] = {
      questions,
      correctCount: current.correctCount + (signal.result === "correct" ? 1 : 0),
      timeoutCount: current.timeoutCount + (signal.result === "timeout" ? 1 : 0),
      averageResponseTimeMs: Math.round(totalResponseTime / questions)
    };

    return accumulator;
  }, {});

  const summary: RunBehaviorSummary = {
    correctCount,
    incorrectCount,
    timeoutCount,
    averageResponseTimeMs,
    averageFirstSelectionTimeMs,
    selectionChangeRate: signals.length === 0 ? 0 : Number((totalSelectionChanges / signals.length).toFixed(2)),
    under5sLockCount,
    pressureMissCount,
    categoryBreakdown
  };

  return summary;
}

function roundRate(value: number) {
  return Number(value.toFixed(3));
}

function deriveConfidenceStyle(input: {
  questionsObserved: number;
  accuracyRate: number;
  avgSelectionChangeCount: number;
}) {
  if (input.questionsObserved < PLAYER_MODEL_THRESHOLDS.minimumQuestionsForStyle) {
    return "insufficient-data" as const;
  }

  if (
    input.accuracyRate >= PLAYER_MODEL_THRESHOLDS.decisiveAccuracyRate &&
    input.avgSelectionChangeCount <= PLAYER_MODEL_THRESHOLDS.decisiveSelectionChangeRate
  ) {
    return "decisive" as const;
  }

  if (
    input.avgSelectionChangeCount >= PLAYER_MODEL_THRESHOLDS.waveringSelectionChangeRate ||
    input.accuracyRate < PLAYER_MODEL_THRESHOLDS.waveringAccuracyRate
  ) {
    return "wavering" as const;
  }

  return "measured" as const;
}

function deriveHesitationStyle(input: {
  questionsObserved: number;
  avgFirstSelectionTimeMs: number | null;
  avgResponseTimeMs: number | null;
}) {
  if (input.questionsObserved < PLAYER_MODEL_THRESHOLDS.minimumQuestionsForStyle || input.avgResponseTimeMs === null) {
    return "insufficient-data" as const;
  }

  if (
    (input.avgFirstSelectionTimeMs ?? input.avgResponseTimeMs) <=
    PLAYER_MODEL_THRESHOLDS.fastReaderFirstSelectionMs
  ) {
    return "fast-reader" as const;
  }

  if (input.avgResponseTimeMs >= PLAYER_MODEL_THRESHOLDS.lateCommitterResponseMs) {
    return "late-committer" as const;
  }

  return "deliberate-reader" as const;
}

function derivePressureStyle(input: {
  questionsObserved: number;
  pressureEventsObserved: number;
  pressureAccuracyRate: number;
  pressureTimeoutRate: number;
}) {
  if (
    input.questionsObserved < PLAYER_MODEL_THRESHOLDS.minimumQuestionsForStyle ||
    input.pressureEventsObserved < PLAYER_MODEL_THRESHOLDS.minimumPressureEventsForPressureStyle
  ) {
    return "insufficient-data" as const;
  }

  if (input.pressureTimeoutRate >= PLAYER_MODEL_THRESHOLDS.timeoutPronePressureTimeoutRate) {
    return "timeout-prone" as const;
  }

  if (
    input.pressureAccuracyRate >= PLAYER_MODEL_THRESHOLDS.steadyPressureAccuracyRate &&
    input.pressureTimeoutRate <= PLAYER_MODEL_THRESHOLDS.steadyPressureTimeoutRate
  ) {
    return "steady-under-pressure" as const;
  }

  return "pressure-sensitive" as const;
}

export function buildPlayerModelSnapshot(input: {
  questionSignals: QuestionBehaviorSignal[];
  runsObserved: number;
  modelVersion?: string;
}) {
  const { questionSignals } = input;
  const runsObserved = input.runsObserved;
  const questionsObserved = questionSignals.length;
  const correctCount = questionSignals.filter((signal) => signal.result === "correct").length;
  const timeoutCount = questionSignals.filter((signal) => signal.result === "timeout").length;
  const firstSelectionTimes = questionSignals
    .map((signal) => signal.firstSelectionTimeMs)
    .filter((value): value is number => value !== null);
  const pressureSignals = questionSignals.filter((signal) => signal.lockedWithUnder5s);
  const pressureCorrect = pressureSignals.filter((signal) => signal.result === "correct").length;
  const pressureTimeouts = pressureSignals.filter((signal) => signal.result === "timeout").length;
  const accuracyRate = questionsObserved === 0 ? 0 : roundRate(correctCount / questionsObserved);
  const timeoutRate = questionsObserved === 0 ? 0 : roundRate(timeoutCount / questionsObserved);
  const avgResponseTimeMs = questionSignals.length === 0 ? null : Math.round(questionSignals.reduce((sum, signal) => sum + signal.responseTimeMs, 0) / questionSignals.length);
  const avgFirstSelectionTimeMs =
    firstSelectionTimes.length === 0
      ? null
      : Math.round(firstSelectionTimes.reduce((sum, value) => sum + value, 0) / firstSelectionTimes.length);
  const avgSelectionChangeCount =
    questionsObserved === 0
      ? 0
      : roundRate(
          questionSignals.reduce((sum, signal) => sum + signal.selectionChangeCount, 0) / questionsObserved
        );
  const pressureAccuracyRate =
    pressureSignals.length === 0 ? 0 : roundRate(pressureCorrect / pressureSignals.length);
  const pressureTimeoutRate =
    pressureSignals.length === 0 ? 0 : roundRate(pressureTimeouts / pressureSignals.length);
  const categorySnapshot = questionSignals.reduce<Record<string, CategoryModelSnapshot>>((accumulator, signal) => {
    const current = accumulator[signal.category] ?? {
      questions: 0,
      accuracyRate: 0,
      timeoutRate: 0,
      averageResponseTimeMs: 0
    };
    const questions = current.questions + 1;
    const totalCorrectForCategory = Math.round(current.accuracyRate * current.questions) + (signal.result === "correct" ? 1 : 0);
    const totalTimeoutsForCategory = Math.round(current.timeoutRate * current.questions) + (signal.result === "timeout" ? 1 : 0);
    const totalResponseForCategory = current.averageResponseTimeMs * current.questions + signal.responseTimeMs;

    accumulator[signal.category] = {
      questions,
      accuracyRate: roundRate(totalCorrectForCategory / questions),
      timeoutRate: roundRate(totalTimeoutsForCategory / questions),
      averageResponseTimeMs: Math.round(totalResponseForCategory / questions)
    };

    return accumulator;
  }, {});

  const snapshot: PlayerModelSnapshot = {
    runsObserved,
    questionsObserved,
    accuracyRate,
    timeoutRate,
    avgResponseTimeMs,
    avgFirstSelectionTimeMs,
    avgSelectionChangeCount,
    pressureAccuracyRate,
    pressureTimeoutRate,
    confidenceStyle: deriveConfidenceStyle({
      questionsObserved,
      accuracyRate,
      avgSelectionChangeCount
    }),
    hesitationStyle: deriveHesitationStyle({
      questionsObserved,
      avgFirstSelectionTimeMs,
      avgResponseTimeMs
    }),
    pressureStyle: derivePressureStyle({
      questionsObserved,
      pressureEventsObserved: pressureSignals.length,
      pressureAccuracyRate,
      pressureTimeoutRate
    }),
    categorySnapshot,
    modelVersion: input.modelVersion ?? "player-model-v1"
  };

  return snapshot;
}
