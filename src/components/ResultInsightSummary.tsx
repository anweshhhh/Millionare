import type { InsightSummaryPayload } from "../domain/insights.ts";

type ResultInsightSummaryProps = {
  insightSummary: InsightSummaryPayload;
};

export function ResultInsightSummary({ insightSummary }: ResultInsightSummaryProps) {
  if (!insightSummary.primary) {
    return null;
  }

  return (
    <section className="result-insight-card" aria-label="Post-run insight summary">
      <div className="result-insight-topline">
        <span>Mind read</span>
        <span>{insightSummary.primary.confidence === "high" ? "clear signal" : "partial signal"}</span>
      </div>

      <div className="result-insight-stack">
        <article
          className={[
            "result-insight-line",
            "is-primary",
            insightSummary.primary.strength === "strong" ? "is-strong" : "is-softened"
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <p>{insightSummary.primary.text}</p>
        </article>

        {insightSummary.secondary ? (
          <article
            className={[
              "result-insight-line",
              "is-secondary",
              insightSummary.secondary.strength === "strong" ? "is-strong" : "is-softened"
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <p>{insightSummary.secondary.text}</p>
          </article>
        ) : null}
      </div>
    </section>
  );
}
