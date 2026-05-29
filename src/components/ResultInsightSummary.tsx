import type { InsightSummaryPayload } from "../domain/insights.ts";
import type { RunIdentity } from "../domain/mind-read.ts";

type ResultInsightSummaryProps = {
  insightSummary: InsightSummaryPayload;
  runIdentity: RunIdentity | null;
  insightLabel: string;
};

export function ResultInsightSummary({ insightSummary, runIdentity, insightLabel }: ResultInsightSummaryProps) {
  if (!insightSummary.primary && !runIdentity) {
    return null;
  }

  return (
    <section className="result-insight-card" aria-label="Post-run insight summary">
      <div className="result-insight-topline">
        <span>Mind read</span>
        <span>{insightLabel}</span>
      </div>

      {runIdentity ? (
        <article className="result-identity-line">
          <strong>{runIdentity.label}</strong>
          <p>{runIdentity.sublabel}</p>
        </article>
      ) : null}

      <div className="result-insight-stack">
        {insightSummary.primary ? (
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
        ) : null}

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
