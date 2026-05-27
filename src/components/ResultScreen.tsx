import type { InsightSummaryPayload } from "../domain/insights.ts";
import { BASELINE_STEP, getStepByRank, PROGRESSION_LADDER } from "../domain/progression.ts";
import { ResultInsightSummary } from "./ResultInsightSummary.tsx";
import { getResultAuthMessage } from "./result-screen-view.ts";

type ResultScreenProps = {
  outcome: "eliminated" | "completed";
  highestClearedRank: number;
  correctCount: number;
  totalQuestions: number;
  bestReserve: number;
  failureReason: "wrong-answer" | "timeout" | null;
  onReplay: () => void;
  canSaveRun: boolean;
  isSaveConfigured: boolean;
  saveState: "idle" | "sending-link" | "check-email" | "saving" | "saved" | "error";
  saveMessage: string | null;
  signedInEmail: string | null;
  insightSummary: InsightSummaryPayload;
  onSaveRun?: () => void;
};

export function ResultScreen(props: ResultScreenProps) {
  const {
    outcome,
    highestClearedRank,
    correctCount,
    totalQuestions,
    bestReserve,
    failureReason,
    onReplay,
    canSaveRun,
    isSaveConfigured,
    saveState,
    saveMessage,
    signedInEmail,
    insightSummary,
    onSaveRun
  } = props;
  const highestStep = getStepByRank(highestClearedRank);
  const authMessage = getResultAuthMessage({ signedInEmail, saveState, saveMessage });
  const headline = outcome === "completed" ? "Pattern Crowned" : "Signal Lost";
  const subhead =
    outcome === "completed"
      ? "You cleared the full fictional ladder and held the read all the way through."
      : failureReason === "timeout"
        ? "The timer hit zero before the answer was locked."
        : "A wrong read ended the run before the ladder was complete.";

  return (
    <section className={["screen", "result-screen", outcome === "completed" ? "is-completed" : "is-eliminated"].join(" ")}>
      <div className={["result-shell", outcome === "completed" ? "is-completed" : "is-eliminated"].join(" ")}>
        <div className={["result-banner", outcome === "completed" ? "is-completed" : "is-eliminated"].join(" ")}>
          <div className="eyebrow">Run Complete</div>
          <h1>{headline}</h1>
          <p>{subhead}</p>
        </div>

        <div className="result-ladder-card">
          <div className="result-ladder-topline">
            <span>Run trace</span>
            <span>
              {highestClearedRank} / {PROGRESSION_LADDER.length}
            </span>
          </div>
          <strong className="result-ladder-focus">
            {highestStep ? `${highestStep.code} // ${highestStep.label}` : `${BASELINE_STEP.code} // ${BASELINE_STEP.label}`}
          </strong>
          <div className="result-ladder-meter" aria-hidden="true">
            {PROGRESSION_LADDER.map((step) => (
              <span
                key={step.code}
                className={[
                  "result-ladder-node",
                  step.rank <= highestClearedRank ? "is-cleared" : "",
                  highestStep?.rank === step.rank ? "is-focus" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            ))}
          </div>
          <p className="result-ladder-copy">
            {highestStep ? highestStep.pulse : "The first rung never cleared."}
          </p>
        </div>

        <div className="summary-grid">
          <article className="summary-card">
            <span>Highest rung</span>
            <strong>
              {highestStep ? `${highestStep.code} // ${highestStep.label}` : `${BASELINE_STEP.code} // ${BASELINE_STEP.label}`}
            </strong>
          </article>

          <article className="summary-card">
            <span>Correct answers</span>
            <strong>
              {correctCount} / {totalQuestions}
            </strong>
          </article>

          <article className="summary-card">
            <span>Best reserve</span>
            <strong>{bestReserve}s</strong>
          </article>

          <article className="summary-card">
            <span>Ladder cleared</span>
            <strong>
              {highestClearedRank} / {PROGRESSION_LADDER.length}
            </strong>
          </article>
        </div>

        <ResultInsightSummary insightSummary={insightSummary} />

        <div className="result-action">
          <button className="primary-cta result-cta" type="button" onClick={onReplay}>
            Play Again
          </button>
          {canSaveRun ? (
            <button className="secondary-cta result-secondary-cta" type="button" onClick={onSaveRun} disabled={!isSaveConfigured}>
              Create Account to Save This Run
            </button>
          ) : null}
          <p className="result-note">A fresh run begins instantly from the chair.</p>
          {authMessage ? <p className="result-auth-note">{authMessage}</p> : null}
          {!signedInEmail && !isSaveConfigured && canSaveRun ? (
            <p className="result-auth-note">Connect Supabase credentials to enable secure save.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
