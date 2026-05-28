import type { AnswerRecord, GameAction, GameState, LifelineState } from "../domain/game.ts";
import { PROGRESSION_LADDER } from "../domain/progression.ts";

export const QUESTION_TIME_LIMIT = 20;
export const SUSPENSE_DURATION_MS = 1500;
export const REVEAL_DWELL_MS = 1300;
export const EXTRA_TIME_LIFELINE_SECONDS = 10;

function createInitialLifelines(): LifelineState {
  return {
    fiftyFifty: true,
    extraTime: true,
    secondChance: true,
    secondChanceArmed: false
  };
}

function createRunState(runNumber: number, firstQuestionId: string, questionCount: number): GameState {
  return {
    phase: "active",
    runNumber,
    questionCount,
    questionIndex: 0,
    questionOrder: [firstQuestionId],
    selectedAnswer: null,
    lockedAnswer: null,
    revealResult: null,
    timeRemaining: QUESTION_TIME_LIMIT,
    answerLog: [],
    lastRecord: null,
    outcome: null,
    failureReason: null,
    lifelines: createInitialLifelines(),
    eliminatedAnswerIndexes: [],
    pendingSecondChanceRecovery: false
  };
}

function buildRecord(
  state: GameState,
  result: AnswerRecord["result"],
  timeRemaining: number,
  lockedAnswer = state.lockedAnswer
): AnswerRecord {
  const currentQuestionId = state.questionOrder[state.questionIndex];

  if (!currentQuestionId) {
    throw new Error("Current question is missing from game state.");
  }

  return {
    questionId: currentQuestionId,
    result,
    selectedAnswer: state.selectedAnswer,
    lockedAnswer,
    timeRemaining
  };
}

export function createInitialGameState(): GameState {
  return {
    phase: "entry",
    runNumber: 1,
    questionCount: 0,
    questionIndex: 0,
    questionOrder: [],
    selectedAnswer: null,
    lockedAnswer: null,
    revealResult: null,
    timeRemaining: QUESTION_TIME_LIMIT,
    answerLog: [],
    lastRecord: null,
    outcome: null,
    failureReason: null,
    lifelines: createInitialLifelines(),
    eliminatedAnswerIndexes: [],
    pendingSecondChanceRecovery: false
  };
}

export function getCorrectCount(state: GameState) {
  return state.answerLog.filter((record) => record.result === "correct").length;
}

export function getHighestClearedRank(state: GameState) {
  return Math.min(getCorrectCount(state), PROGRESSION_LADDER.length);
}

export function getCurrentTargetRank(state: GameState) {
  return Math.min(state.questionIndex + 1, state.questionCount || PROGRESSION_LADDER.length, PROGRESSION_LADDER.length);
}

export function getBestReserve(state: GameState) {
  return state.answerLog
    .filter((record) => record.result === "correct")
    .reduce((best, record) => Math.max(best, record.timeRemaining), 0);
}

export function getCurrentQuestionId(state: GameState) {
  const currentQuestionId = state.questionOrder[state.questionIndex];

  if (!currentQuestionId) {
    throw new Error("Current question is missing from game state.");
  }

  return currentQuestionId;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_RUN":
      return createRunState(state.runNumber, action.firstQuestionId, action.questionCount);
    case "REPLAY":
      return createRunState(state.runNumber + 1, action.firstQuestionId, action.questionCount);
    case "SELECT_ANSWER":
      if (state.phase !== "active") {
        return state;
      }

      if (state.eliminatedAnswerIndexes.includes(action.answerIndex)) {
        return state;
      }

      return {
        ...state,
        selectedAnswer: action.answerIndex
      };
    case "LOCK_ANSWER":
      if (state.phase !== "active" || state.selectedAnswer === null) {
        return state;
      }

      return {
        ...state,
        phase: "suspense",
        lockedAnswer: state.selectedAnswer
      };
    case "USE_LIFELINE_50_50":
      if (state.phase !== "active" || !state.lifelines.fiftyFifty || state.eliminatedAnswerIndexes.length > 0) {
        return state;
      }

      return {
        ...state,
        lifelines: {
          ...state.lifelines,
          fiftyFifty: false
        },
        eliminatedAnswerIndexes: [0, 1, 2, 3].filter(
          (index) => index !== action.correctIndex && index !== state.selectedAnswer
        ).slice(0, 2)
      };
    case "USE_LIFELINE_EXTRA_TIME":
      if (state.phase !== "active" || !state.lifelines.extraTime) {
        return state;
      }

      return {
        ...state,
        lifelines: {
          ...state.lifelines,
          extraTime: false
        },
        timeRemaining: Math.min(QUESTION_TIME_LIMIT + EXTRA_TIME_LIFELINE_SECONDS, state.timeRemaining + EXTRA_TIME_LIFELINE_SECONDS)
      };
    case "USE_LIFELINE_SECOND_CHANCE":
      if (state.phase !== "active" || !state.lifelines.secondChance || state.lifelines.secondChanceArmed) {
        return state;
      }

      return {
        ...state,
        lifelines: {
          ...state.lifelines,
          secondChanceArmed: true
        }
      };
    case "TICK":
      if (state.phase !== "active") {
        return state;
      }

      if (state.timeRemaining > 1) {
        return {
          ...state,
          timeRemaining: state.timeRemaining - 1
        };
      }

      const timeoutRecord = buildRecord(state, "timeout", 0, null);

      const shouldRecoverTimeout = state.lifelines.secondChance && state.lifelines.secondChanceArmed;

      return {
        ...state,
        phase: "reveal",
        timeRemaining: 0,
        revealResult: "incorrect",
        outcome: shouldRecoverTimeout ? null : "eliminated",
        failureReason: shouldRecoverTimeout ? null : "timeout",
        lastRecord: timeoutRecord,
        answerLog: [...state.answerLog, timeoutRecord],
        pendingSecondChanceRecovery: shouldRecoverTimeout,
        lifelines: shouldRecoverTimeout
          ? {
              ...state.lifelines,
              secondChance: false,
              secondChanceArmed: false
            }
          : state.lifelines
      };
    case "RESOLVE_SUSPENSE":
      if (state.phase !== "suspense" || state.lockedAnswer === null) {
        return state;
      }

      if (state.lockedAnswer === action.correctIndex) {
        const correctRecord = buildRecord(state, "correct", state.timeRemaining);

        return {
          ...state,
          phase: "reveal",
          revealResult: "correct",
          answerLog: [...state.answerLog, correctRecord],
          lastRecord: correctRecord
        };
      }

      const incorrectRecord = buildRecord(state, "incorrect", state.timeRemaining);
      const shouldRecoverIncorrect = state.lifelines.secondChance && state.lifelines.secondChanceArmed;

      return {
        ...state,
        phase: "reveal",
        revealResult: "incorrect",
        outcome: shouldRecoverIncorrect ? null : "eliminated",
        failureReason: shouldRecoverIncorrect ? null : "wrong-answer",
        answerLog: [...state.answerLog, incorrectRecord],
        lastRecord: incorrectRecord,
        pendingSecondChanceRecovery: shouldRecoverIncorrect,
        lifelines: shouldRecoverIncorrect
          ? {
              ...state.lifelines,
              secondChance: false,
              secondChanceArmed: false
            }
          : state.lifelines
      };
    case "CONTINUE":
      if (state.phase !== "reveal") {
        return state;
      }

      if (state.revealResult === "incorrect" && state.pendingSecondChanceRecovery) {
        return {
          ...state,
          phase: "active",
          selectedAnswer: null,
          lockedAnswer: null,
          revealResult: null,
          timeRemaining: QUESTION_TIME_LIMIT,
          lastRecord: null,
          failureReason: null,
          pendingSecondChanceRecovery: false
        };
      }

      if (state.revealResult === "incorrect") {
        return {
          ...state,
          phase: "result"
        };
      }

      if (state.questionIndex === state.questionCount - 1) {
        return {
          ...state,
          phase: "result",
          outcome: "completed"
        };
      }

      if (!action.nextQuestionId) {
        return {
          ...state,
          phase: "result",
          outcome: "completed"
        };
      }

      return {
        ...state,
        phase: "active",
        questionIndex: state.questionIndex + 1,
        questionOrder: [...state.questionOrder, action.nextQuestionId],
        selectedAnswer: null,
        lockedAnswer: null,
        revealResult: null,
        timeRemaining: QUESTION_TIME_LIMIT,
        lastRecord: null,
        failureReason: null,
        eliminatedAnswerIndexes: [],
        pendingSecondChanceRecovery: false,
        lifelines: {
          ...state.lifelines,
          secondChanceArmed: false
        }
      };
    default:
      return state;
  }
}
