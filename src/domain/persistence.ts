import type { PlayerModelSnapshot, QuestionBehaviorSignal, RunBehaviorSummary } from "./player-model.ts";

export type PersistedRunOutcome = "eliminated" | "completed";
export type PersistedFailureReason = "wrong-answer" | "timeout" | null;

export type ProfileSummary = {
  userId: string;
  createdAt: string;
  updatedAt: string;
  displayName: string | null;
  bestScoreRank: number;
  currentStreak: number;
  lastPlayedAt: string | null;
  bestRunId: string | null;
};

export type PersistedRun = {
  id: string;
  userId: string;
  createdAt: string;
  startedAt: string;
  completedAt: string;
  outcome: PersistedRunOutcome;
  highestRank: number;
  correctAnswers: number;
  totalQuestions: number;
  failureReason: PersistedFailureReason;
  bestReserveSeconds: number | null;
  questionSetVersion: string;
  avgResponseTimeMs: number | null;
  avgFirstSelectionTimeMs: number | null;
  selectionChangeRate: number | null;
  pressureMissCount: number;
  timeoutCount: number;
  categorySummary: RunBehaviorSummary["categoryBreakdown"] | null;
};

export type PersistedRunInsert = Omit<PersistedRun, "id" | "createdAt">;

export type PersistedQuestionBehaviorSignal = QuestionBehaviorSignal & {
  id: string;
  runId: string;
  userId: string;
  createdAt: string;
};

export type PersistedQuestionBehaviorSignalInsert = Omit<
  PersistedQuestionBehaviorSignal,
  "id" | "createdAt" | "runId" | "userId"
>;

export type PendingRunBridge = Omit<PersistedRunInsert, "userId"> & {
  localRunKey: string;
  behaviorSummary: RunBehaviorSummary;
  questionSignals: QuestionBehaviorSignal[];
};

export type PersistedPlayerModel = PlayerModelSnapshot & {
  userId: string;
  createdAt: string;
  updatedAt: string;
};
