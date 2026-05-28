import type {
  AdaptationFairnessReview,
  AdminIntelligenceReport,
  DropoffRankReview,
  QuestionCalibrationReview
} from "./admin-intelligence.ts";

export type AdminReportOptions = {
  maxQuestionReviews?: number;
  maxDropoffRanks?: number;
};

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatQuestionReview(review: QuestionCalibrationReview) {
  const label = review.externalKey ?? review.questionId;
  const metadata = [review.category, review.difficultyBand, review.pressureTag].filter(Boolean).join(" / ");
  const flags = review.flags.length === 0 ? "no flags" : review.flags.join(", ");

  return `- [${review.status}] ${label} (${metadata}) :: miss ${formatPercent(review.missRate)}, timeout ${formatPercent(review.timeoutRate)}, late lock ${formatPercent(review.lateLockRate)}, avg changes ${review.averageSelectionChangeCount}, flags: ${flags}`;
}

function formatDropoffRank(review: DropoffRankReview) {
  const category = review.dominantCategory ? `, dominant ${review.dominantCategory}` : "";
  return `- [${review.status}] rank ${review.rank} :: endings ${review.endings} (${formatPercent(review.endingRate)}), timeouts ${review.timeoutEndings} (${formatPercent(review.timeoutRate)})${category}`;
}

function formatAdaptationFairness(review: AdaptationFairnessReview) {
  const notes = review.notes.length === 0 ? "none" : review.notes.join(", ");

  return [
    `Status: ${review.status} (${review.confidence} confidence)`,
    `Transitions observed: ${review.transitionsObserved}`,
    `Transitions with metadata: ${review.transitionsWithMetadata}`,
    `Harsh pressure rebounds: ${review.harshPressureRebounds}`,
    `Timeout pressure rebounds: ${review.timeoutPressureRebounds}`,
    `Repeated-category rebounds: ${review.repeatedCategoryRebounds}`,
    `Difficulty leaps: ${review.difficultyLeaps}`,
    `Notes: ${notes}`
  ].join("\n");
}

export function formatAdminIntelligenceReport(report: AdminIntelligenceReport, options: AdminReportOptions = {}) {
  const maxQuestionReviews = options.maxQuestionReviews ?? 8;
  const maxDropoffRanks = options.maxDropoffRanks ?? 5;
  const questionReviewLines = report.questionReviews.slice(0, maxQuestionReviews).map(formatQuestionReview);
  const dropoffLines = report.dropoffRanks.slice(0, maxDropoffRanks).map(formatDropoffRank);

  return [
    "# Millionaire Admin Intelligence Report",
    "",
    "## Summary",
    `- Runs observed: ${report.summary.runsObserved}`,
    `- Eliminated runs observed: ${report.summary.eliminatedRunsObserved}`,
    `- Question signals observed: ${report.summary.questionSignalsObserved}`,
    `- Question reviews produced: ${report.summary.questionReviewsProduced}`,
    `- Player models observed: ${report.summary.playerModelsObserved}`,
    "",
    "## Question Reviews",
    ...(questionReviewLines.length > 0 ? questionReviewLines : ["- none"]),
    "",
    "## Drop-off Hotspots",
    ...(dropoffLines.length > 0 ? dropoffLines : ["- none"]),
    "",
    "## Adaptation Fairness",
    formatAdaptationFairness(report.adaptationFairness)
  ].join("\n");
}
