import { PROGRESSION_LADDER } from "../domain/progression.ts";

type ProgressLadderProps = {
  currentStepCode: string;
  currentStepLabel: string;
  currentRank: number;
  highestClearedRank: number;
  revealResult: "correct" | "incorrect" | null;
  phase: "active" | "suspense" | "reveal" | "result";
  outcome: "eliminated" | "completed" | null;
};

export function ProgressLadder(props: ProgressLadderProps) {
  const { currentStepCode, currentStepLabel, currentRank, highestClearedRank, revealResult, phase, outcome } = props;
  const ladderStatus =
    phase === "suspense"
      ? "Lock held"
      : phase === "reveal"
        ? revealResult === "correct"
          ? "Climb confirmed"
          : "Signal break"
        : "Tracking live";
  const completionPercent = `${(highestClearedRank / PROGRESSION_LADDER.length) * 100}%`;

  return (
    <aside className={["ladder-rail", `phase-${phase}`].join(" ")} aria-label="Progression ladder">
      <div className="ladder-head">
        <div className="ladder-title">Live Ladder</div>
        <div className="ladder-focus">{currentStepCode}</div>
        <div className="ladder-status">{ladderStatus}</div>
        <div className="ladder-focus-label">{currentStepLabel}</div>
        <div className="ladder-meter">
          <div className="ladder-meter-fill" style={{ height: completionPercent }} />
        </div>
      </div>
      {[...PROGRESSION_LADDER].reverse().map((step) => {
        const isCleared = step.rank <= highestClearedRank;
        const isActive = phase !== "result" && step.rank === currentRank;
        const isResolvedCorrect = phase === "reveal" && revealResult === "correct" && step.rank === currentRank;
        const isCompletedRun = outcome === "completed" && highestClearedRank === PROGRESSION_LADDER.length;

        return (
          <div
            key={step.code}
            className={[
              "ladder-step",
              isCleared ? "is-cleared" : "",
              isActive ? "is-active" : "",
              isResolvedCorrect ? "is-resolved" : "",
              isCompletedRun ? "is-complete" : ""
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="ladder-step-code">{step.code}</span>
            <span className="ladder-step-label">{step.label}</span>
          </div>
        );
      })}
    </aside>
  );
}
