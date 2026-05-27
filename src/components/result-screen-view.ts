import type { InsightSummaryPayload } from "../domain/insights.ts";

export type ResultScreenSaveState = "idle" | "sending-link" | "check-email" | "saving" | "saved" | "error";

export function getResultAuthMessage(input: {
  signedInEmail: string | null;
  saveState: ResultScreenSaveState;
  saveMessage: string | null;
}) {
  const { signedInEmail, saveState, saveMessage } = input;

  if (signedInEmail) {
    if (saveState === "error" && saveMessage) {
      return saveMessage;
    }

    if (saveState === "saving") {
      return "Securing this result to your account.";
    }

    if (saveState === "saved") {
      return `Run secured to ${signedInEmail}.`;
    }

    return `Signed in as ${signedInEmail}. Completed runs save from this result state.`;
  }

  return saveMessage;
}

export function shouldRenderInsightSummary(insightSummary: InsightSummaryPayload) {
  return insightSummary.primary !== null;
}

export function shouldRenderSecondaryInsight(insightSummary: InsightSummaryPayload) {
  return insightSummary.primary !== null && insightSummary.secondary !== null;
}
