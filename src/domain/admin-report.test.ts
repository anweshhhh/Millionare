import test from "node:test";
import assert from "node:assert/strict";

import { formatAdminIntelligenceReport } from "./admin-report.ts";
import type { AdminIntelligenceReport } from "./admin-intelligence.ts";

const report: AdminIntelligenceReport = {
  summary: {
    runsObserved: 12,
    eliminatedRunsObserved: 8,
    questionSignalsObserved: 73,
    questionReviewsProduced: 3,
    playerModelsObserved: 4
  },
  questionReviews: [
    {
      questionId: "q-1",
      externalKey: "launch-q-001",
      category: "Science",
      difficultyBand: "easy",
      pressureTag: "calm",
      questionSetVersion: "launch-v1",
      sourceLabel: "curated-launch",
      observations: 6,
      missRate: 0.667,
      timeoutRate: 0.167,
      averageResponseTimeMs: 12000,
      averageSelectionChangeCount: 1.17,
      lateLockRate: 0.5,
      flags: ["elevated-miss-rate", "high-selection-churn"],
      status: "review",
      confidence: "high"
    }
  ],
  dropoffRanks: [
    {
      rank: 5,
      endings: 4,
      endingRate: 0.5,
      timeoutEndings: 2,
      timeoutRate: 0.5,
      dominantCategory: "Science",
      status: "review",
      confidence: "high"
    }
  ],
  adaptationFairness: {
    transitionsObserved: 10,
    transitionsWithMetadata: 10,
    harshPressureRebounds: 2,
    timeoutPressureRebounds: 1,
    repeatedCategoryRebounds: 1,
    difficultyLeaps: 0,
    status: "watch",
    confidence: "high",
    notes: ["spiky-after-miss", "spiky-after-timeout"]
  }
};

test("formatAdminIntelligenceReport renders a compact internal report", () => {
  const output = formatAdminIntelligenceReport(report);

  assert.match(output, /# Millionaire Admin Intelligence Report/);
  assert.match(output, /Runs observed: 12/);
  assert.match(output, /\[review\] launch-q-001/);
  assert.match(output, /rank 5 :: endings 4 \(50%\)/);
  assert.match(output, /Status: watch \(high confidence\)/);
  assert.match(output, /Notes: spiky-after-miss, spiky-after-timeout/);
});

test("formatAdminIntelligenceReport stays compact when sections are empty", () => {
  const output = formatAdminIntelligenceReport(
    {
      ...report,
      questionReviews: [],
      dropoffRanks: []
    },
    { maxQuestionReviews: 2, maxDropoffRanks: 2 }
  );

  assert.ok(output.includes("## Question Reviews\n- none"));
  assert.ok(output.includes("## Drop-off Hotspots\n- none"));
});
