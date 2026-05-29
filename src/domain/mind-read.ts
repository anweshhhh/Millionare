import type { FailureReason, RunOutcome } from "./game.ts";
import type { InsightSummaryPayload } from "./insights.ts";
import type { QuestionBehaviorSignal, RunBehaviorSummary } from "./player-model.ts";

export const MIND_READ_RULES = {
  fastResponseMs: 5200,
  lateResponseMs: 13000,
  highSwitchCount: 2,
  highSwitchRate: 0.95,
  minimumSignalsForIdentity: 3,
  minimumSignalsForMicroRead: 2
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

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function pickVariant(seed: string, variants: string[]) {
  if (variants.length === 0) {
    return null;
  }

  return variants[hashString(seed) % variants.length] ?? variants[0] ?? null;
}

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

  if (lastSignal.questionRank < MIND_READ_RULES.minimumSignalsForMicroRead && context.failureReason !== "timeout") {
    return null;
  }

  if (context.failureReason === "timeout") {
    return pickVariant(`${lastSignal.questionId}:timeout`, [
      "No lock. Pressure owned this read.",
      "Clock overrun. The read never locked."
    ]);
  }

  if (context.revealResult === "correct") {
    if (lastSignal.selectionChangeCount >= MIND_READ_RULES.highSwitchCount) {
      return pickVariant(`${lastSignal.questionId}:correct:late-switch`, [
        "Late switch. Clean hold.",
        "Read shifted late, then stabilized."
      ]);
    }

    if (lastSignal.lockedWithUnder5s) {
      return pickVariant(`${lastSignal.questionId}:correct:pressure-lock`, [
        "Fast lock under pressure.",
        "Clock tightened. You held the read."
      ]);
    }

    if (lastSignal.responseTimeMs <= MIND_READ_RULES.fastResponseMs) {
      return pickVariant(`${lastSignal.questionId}:correct:first-read`, [
        "First read, clean strike.",
        "Immediate commit. Clean conversion."
      ]);
    }

    return null;
  }

  if (lastSignal.selectionChangeCount >= MIND_READ_RULES.highSwitchCount) {
    return pickVariant(`${lastSignal.questionId}:incorrect:late-switch`, [
      "Late switch. Read drifted.",
      "Certainty moved late and broke."
    ]);
  }

  if (lastSignal.lockedWithUnder5s) {
    return pickVariant(`${lastSignal.questionId}:incorrect:pressure`, [
      "Pressure narrowed the read.",
      "Late pressure bent the lock."
    ]);
  }

  return pickVariant(`${lastSignal.questionId}:incorrect:certainty`, [
    "Certainty broke on this rung.",
    "This lock cracked before the climb held."
  ]);
}

export function deriveTransitionRead(
  context: MindReadRevealContext,
  lastSignal: QuestionBehaviorSignal | null
) {
  if (context.phase !== "reveal" || context.revealResult !== "correct" || context.isFinalQuestion) {
    return null;
  }

  if (!lastSignal) {
    return null;
  }

  if (lastSignal.lockedWithUnder5s) {
    return pickVariant(`${lastSignal.questionId}:transition:pressure`, [
      "Next read pushes pressure.",
      "The next rung tests composure."
    ]);
  }

  if (lastSignal.selectionChangeCount >= MIND_READ_RULES.highSwitchCount) {
    return pickVariant(`${lastSignal.questionId}:transition:certainty`, [
      "Next read tests certainty.",
      "The next lock probes commitment."
    ]);
  }

  if (lastSignal.responseTimeMs >= MIND_READ_RULES.lateResponseMs) {
    return pickVariant(`${lastSignal.questionId}:transition:pace`, [
      "Next read rewards quicker commitment.",
      "The table now favors faster reads."
    ]);
  }

  return null;
}

export function deriveRunIdentity(
  runSummary: RunBehaviorSummary,
  questionSignals: QuestionBehaviorSignal[],
  outcome: RunOutcome | null
): RunIdentity | null {
  if (!outcome || questionSignals.length < MIND_READ_RULES.minimumSignalsForIdentity) {
    return null;
  }

  const seedSignal = questionSignals.at(-1)?.questionId ?? "run";

  if (outcome === "completed" && runSummary.timeoutCount === 0 && runSummary.pressureMissCount === 0) {
    return {
      label: "The Clean Read",
      sublabel:
        pickVariant(`${seedSignal}:identity:clean`, [
          "You gave the clock no opening.",
          "Control stayed with you through the final rung."
        ]) ?? "You gave the clock no opening."
    };
  }

  if (runSummary.timeoutCount >= 2) {
    return {
      label: "The Clock Chaser",
      sublabel:
        pickVariant(`${seedSignal}:identity:clock`, [
          "Pressure set the pace of this run.",
          "The timer dictated too many decisions."
        ]) ?? "Pressure set the pace of this run."
    };
  }

  if (runSummary.selectionChangeRate >= MIND_READ_RULES.highSwitchRate) {
    return {
      label: "The Late Switch",
      sublabel:
        pickVariant(`${seedSignal}:identity:switch`, [
          "Certainty moved late and cost ground.",
          "Read reversals arrived too deep into the clock."
        ]) ?? "Certainty moved late and cost ground."
    };
  }

  if (
    (runSummary.averageFirstSelectionTimeMs ?? runSummary.averageResponseTimeMs) <= MIND_READ_RULES.fastResponseMs &&
    runSummary.selectionChangeRate <= 0.25
  ) {
    return {
      label: "The First Instinct",
      sublabel:
        pickVariant(`${seedSignal}:identity:instinct`, [
          "You trusted fast reads and kept moving.",
          "Quick commitments carried the run."
        ]) ?? "You trusted fast reads and kept moving."
    };
  }

  return {
    label: "The Pressure Climb",
    sublabel:
      pickVariant(`${seedSignal}:identity:pressure-climb`, [
        "You traded pace and control across the ladder.",
        "The climb held, but the rhythm kept shifting."
      ]) ?? "You traded pace and control across the ladder."
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
