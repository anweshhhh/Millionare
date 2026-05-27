export type DifficultyBand = "easy" | "medium" | "hard";
export type PressureTag = "calm" | "neutral" | "spiky";

export type Question = {
  id: string;
  category: string;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
  difficultyBand: DifficultyBand;
  pressureTag: PressureTag;
};

export type LadderStep = {
  rank: number;
  code: string;
  label: string;
  pulse: string;
};

export type GamePhase = "entry" | "active" | "suspense" | "reveal" | "result";
export type RevealResult = "correct" | "incorrect";
export type FailureReason = "wrong-answer" | "timeout";
export type RunOutcome = "eliminated" | "completed";

export type AnswerRecord = {
  questionId: string;
  result: RevealResult | "timeout";
  selectedAnswer: number | null;
  lockedAnswer: number | null;
  timeRemaining: number;
};

export type GameState = {
  phase: GamePhase;
  runNumber: number;
  questionCount: number;
  questionIndex: number;
  questionOrder: string[];
  selectedAnswer: number | null;
  lockedAnswer: number | null;
  revealResult: RevealResult | null;
  timeRemaining: number;
  answerLog: AnswerRecord[];
  lastRecord: AnswerRecord | null;
  outcome: RunOutcome | null;
  failureReason: FailureReason | null;
};

export type GameAction =
  | { type: "START_RUN"; firstQuestionId: string; questionCount: number }
  | { type: "REPLAY"; firstQuestionId: string; questionCount: number }
  | { type: "SELECT_ANSWER"; answerIndex: number }
  | { type: "LOCK_ANSWER" }
  | { type: "TICK" }
  | { type: "RESOLVE_SUSPENSE"; correctIndex: number }
  | { type: "CONTINUE"; nextQuestionId?: string };
