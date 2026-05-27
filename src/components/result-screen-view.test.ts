import assert from "node:assert/strict";
import test from "node:test";
import type { InsightSummaryPayload } from "../domain/insights.ts";
import {
  getResultAuthMessage,
  shouldRenderInsightSummary,
  shouldRenderSecondaryInsight
} from "./result-screen-view.ts";

function createInsightSummary(input?: Partial<InsightSummaryPayload>): InsightSummaryPayload {
  return {
    primary: input?.primary ?? {
      family: "pressure-read",
      strength: "strong",
      confidence: "high",
      text: "The clock broke this run before certainty did.",
      evidenceScore: 9
    },
    secondary: input?.secondary ?? null
  };
}

test("insight block renders when a primary insight exists", () => {
  assert.equal(shouldRenderInsightSummary(createInsightSummary()), true);
});

test("secondary insight stays optional", () => {
  assert.equal(shouldRenderSecondaryInsight(createInsightSummary()), false);
  assert.equal(
    shouldRenderSecondaryInsight(
      createInsightSummary({
        secondary: {
          family: "confidence-read",
          strength: "softened",
          confidence: "medium",
          text: "This run got expensive when your reads started to drift.",
          evidenceScore: 5
        }
      })
    ),
    true
  );
});

test("suppressed insight state does not render an empty insight block", () => {
  assert.equal(
    shouldRenderInsightSummary({
      primary: null,
      secondary: null
    }),
    false
  );
});

test("replay can remain primary while auth/save messaging stays secondary", () => {
  const authMessage = getResultAuthMessage({
    signedInEmail: null,
    saveState: "idle",
    saveMessage: null
  });

  assert.equal(authMessage, null);
});

test("guest and signed-in result paths both remain safe", () => {
  const guestMessage = getResultAuthMessage({
    signedInEmail: null,
    saveState: "check-email",
    saveMessage: "Magic link sent."
  });
  const signedInMessage = getResultAuthMessage({
    signedInEmail: "player@example.com",
    saveState: "saved",
    saveMessage: "Run secured."
  });

  assert.equal(guestMessage, "Magic link sent.");
  assert.equal(signedInMessage, "Run secured to player@example.com.");
});
