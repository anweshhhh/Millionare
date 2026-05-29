import type { FailureReason, RunOutcome } from "./game.ts";
import type { InsightSummaryPayload } from "./insights.ts";
import type { QuestionBehaviorSignal, RunBehaviorSummary } from "./player-model.ts";

export const MIND_READ_RULES = {
  fastResponseMs: 5200,
  lateResponseMs: 13000,
  highSwitchCount: 2,
  highSwitchRate: 0.95,
  minimumSignalsForIdentity: 3
} as const;

export type MindReadRevealContext = {
  phase: "active" | "suspense" | "reveal";
  revealResult: "correct" | "incorrect" | null;
  failureReason: FailureReason | null;
  pendingSecondChanceRecovery: boolean;
  isFinalQuestion: boolean;
};

export type RunIdentity = {
  label: string;
  sublabel: string;
};

export type MindReadPayload = {
  revealMicroRead: string | null;
  transitionRead: string | null;
  runIdentity: RunIdentity | null;
  insightLabel: string;
};

function getLastSignal(questionSignals: QuestionBehaviorSignal[]) {
  return questionSignals.at(-1) ?? null;
}

export function deriveRevealMicroRead(
  context: MindReadRevealContext,
  lastSignal: QuestionBehaviorSignal | null
) {
  if (context.phase !== "reveal" || !context.revealResult) {
    return null;
  }

  if (context.pendingSecondChanceRecovery) {
    return "Shield triggered. One more read.";
  }

  if (!lastSignal) {
    return null;
  }

  if (context.failureReason === "timeout") {
    return "No lock. Pressure owned this read.";
  }

  if (context.revealResult === "correct") {
    if (lastSignal.selectionChangeCount >= MIND_READ_RULES.highSwitchCount) {
      return "Late switch. Clean hold.";
    }

    if (lastSignal.lockedWithUnder5s) {
      return "Fast lock under pressure.";
    }

    if (lastSignal.responseTimeMs <= MIND_READ_RULES.fastResponseMs) {
      return "First read, clean strike.";
    }

    return "Composed lock. Clear read.";
  }

  if (lastSignal.selectionChangeCount >= MIND_READ_RULES.highSwitchCount) {
    return "Late switch. Read drifted.";
  }

  if (lastSignal.lockedWithUnder5s) {
    return "Pressure narrowed the read.";
  }

  return "Certainty broke on this rung.";
}

export function deriveTransitionRead(
  context: MindReadRevealContext,
  lastSignal: QuestionBehaviorSignal | null
) {
  if (context.phase !== "reveal" || context.revealResult !== "correct" || context.isFinalQuestion) {
    return null;
  }

  if (!lastSignal) {
    return "The table adjusts.";
  }

  if (lastSignal.lockedWithUnder5s) {
    return "Next read pushes pressure.";
  }

  if (lastSignal.selectionChangeCount >= MIND_READ_RULES.highSwitchCount) {
    return "Next read tests certainty.";
  }

  if (lastSignal.responseTimeMs >= MIND_READ_RULES.lateResponseMs) {
    return "Next read rewards quicker commitment.";
  }

  return "The table adjusts.";
}

export function deriveRunIdentity(
  runSummary: RunBehaviorSummary,
  questionSignals: QuestionBehaviorSignal[],
  outcome: RunOutcome | null
): RunIdentity | null {
  if (!outcome || questionSignals.length < MIND_READ_RULES.minimumSignalsForIdentity) {
    return null;
  }

  if (outcome === "completed" && runSummary.timeoutCount === 0 && runSummary.pressureMissCount === 0) {
    return {
      label: "The Clean Read",
      sublabel: "You gave the clock no opening."
    };
  }

  if (runSummary.timeoutCount >= 2) {
    return {
      label: "The Clock Chaser",
      sublabel: "Pressure set the pace of this run."
    };
  }

  if (runSummary.selectionChangeRate >= MIND_READ_RULES.highSwitchRate) {
    return {
      label: "The Late Switch",
      sublabel: "Certainty moved late and cost ground."
    };
  }

  if (
    (runSummary.averageFirstSelectionTimeMs ?? runSummary.averageResponseTimeMs) <= MIND_READ_RULES.fastResponseMs &&
    runSummary.selectionChangeRate <= 0.25
  ) {
    return {
      label: "The First Instinct",
      sublabel: "You trusted fast reads and kept moving."
    };
  }

  return {
    label: "The Pressure Climb",
    sublabel: "You traded pace and control across the ladder."
  };
}

export function deriveMindReadPayload(input: {
  revealContext: MindReadRevealContext;
  questionSignals: QuestionBehaviorSignal[];
  runSummary: RunBehaviorSummary;
  outcome: RunOutcome | null;
  insightSummary: InsightSummaryPayload;
}): MindReadPayload {
  const lastSignal = getLastSignal(input.questionSignals);
  const primaryInsightConfidence = input.insightSummary.primary?.confidence ?? "medium";

  return {
    revealMicroRead: deriveRevealMicroRead(input.revealContext, lastSignal),
    transitionRead: deriveTransitionRead(input.revealContext, lastSignal),
    runIdentity: deriveRunIdentity(input.runSummary, input.questionSignals, input.outcome),
    insightLabel: primaryInsightConfidence === "high" ? "clear signal" : "partial signal"
  };
}
