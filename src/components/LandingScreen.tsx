import type { PersistedRun, ProfileSummary } from "../domain/persistence.ts";
import { BASELINE_STEP, getStepByRank } from "../domain/progression.ts";

type LandingScreenProps = {
  onStart: () => void;
  signedInEmail: string | null;
  authStatusMessage: string | null;
  profile: ProfileSummary | null;
  recentRuns: PersistedRun[] | null;
};

function formatBestScore(bestScoreRank: number) {
  const step = getStepByRank(bestScoreRank);
  const focus = step ? `${step.code} // ${step.label}` : `${BASELINE_STEP.code} // ${BASELINE_STEP.label}`;

  return focus;
}

function formatLastPlayed(lastPlayedAt: string | null) {
  if (!lastPlayedAt) {
    return "No saved run yet";
  }

  const value = new Date(lastPlayedAt);

  if (Number.isNaN(value.getTime())) {
    return "Recently";
  }

  const now = new Date();
  const elapsedMs = now.getTime() - value.getTime();
  const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));

  if (elapsedHours < 1) {
    return "Within the hour";
  }

  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);

  if (elapsedDays < 7) {
    return `${elapsedDays}d ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(value);
}

function formatRecentRunTime(completedAt: string) {
  const value = new Date(completedAt);

  if (Number.isNaN(value.getTime())) {
    return "Recently";
  }

  const now = new Date();
  const elapsedMs = now.getTime() - value.getTime();
  const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));

  if (elapsedHours < 1) {
    return "Just now";
  }

  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric"
  }).format(value);
}

export function LandingScreen({ onStart, signedInEmail, authStatusMessage, profile, recentRuns }: LandingScreenProps) {
  const summaryProfile = signedInEmail && profile ? profile : null;
  const hasSummary = Boolean(summaryProfile);
  const showRecentRuns = Boolean(signedInEmail);
  const displayedRecentRuns = recentRuns?.slice(0, 3) ?? null;

  return (
    <section className="screen landing-screen">
      <div className="hero-shell">
        <div className="hero-header">
          <div className="eyebrow">Mind Reader Protocol</div>
          <div className="hero-chip">{signedInEmail ? "Signed In" : "Immediate Start"}</div>
        </div>
        <h1 className="hero-title">
          Millionaire
          <span>Mind Reader Mode</span>
        </h1>
        <p className="hero-copy">
          A focused hot-seat run. One question, one clock, one decision at a time.
        </p>

        {summaryProfile ? (
          <div className="landing-summary">
            <div className="landing-summary-topline">
              <span>Saved profile</span>
              <span>{signedInEmail}</span>
            </div>
            <div className="landing-summary-grid">
              <article className="summary-card landing-summary-card">
                <span>Best score</span>
                <strong>{formatBestScore(summaryProfile.bestScoreRank)}</strong>
              </article>
              <article className="summary-card landing-summary-card">
                <span>Streak</span>
                <strong>{summaryProfile.currentStreak} run{summaryProfile.currentStreak === 1 ? "" : "s"}</strong>
              </article>
              <article className="summary-card landing-summary-card">
                <span>Last played</span>
                <strong>{formatLastPlayed(summaryProfile.lastPlayedAt)}</strong>
              </article>
            </div>
          </div>
        ) : null}

        <div className="hero-action">
          <button className="primary-cta landing-cta" type="button" onClick={onStart}>
            Start Run
          </button>
          <p className="hero-note">
            {authStatusMessage ??
              (signedInEmail
                ? hasSummary
                  ? "Signed in. Saved progress is loaded. The chair opens immediately."
                  : `Signed in as ${signedInEmail}.`
                : "No setup. The first question opens immediately.")}
          </p>
        </div>

        {showRecentRuns ? (
          <div className="landing-history">
            <div className="landing-history-topline">
              <span>Recent runs</span>
              <span>{recentRuns === null ? "Syncing" : recentRuns.length === 0 ? "No saved runs" : `${displayedRecentRuns?.length ?? 0} shown`}</span>
            </div>

            {recentRuns === null ? <p className="landing-history-empty">Loading recent trace.</p> : null}

            {recentRuns !== null && recentRuns.length === 0 ? (
              <p className="landing-history-empty">No saved runs yet.</p>
            ) : null}

            {displayedRecentRuns && displayedRecentRuns.length > 0 ? (
              <div className="landing-history-list">
                {displayedRecentRuns.map((run) => {
                  const step = getStepByRank(run.highestRank);
                  const focus = step ? `${step.code} // ${step.label}` : `${BASELINE_STEP.code} // ${BASELINE_STEP.label}`;

                  return (
                    <article key={run.id} className={["landing-history-row", run.outcome === "completed" ? "is-completed" : "is-eliminated"].join(" ")}>
                      <div className="landing-history-primary">
                        <div className="landing-history-labels">
                          <span className="landing-history-outcome">{run.outcome === "completed" ? "Cleared" : "Broken"}</span>
                          <strong>{focus}</strong>
                        </div>
                        <span className="landing-history-time">{formatRecentRunTime(run.completedAt)}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
