import type { CSSProperties } from "react";
import type { FailureReason, LadderStep, LifelineState, Question, RevealResult } from "../domain/game.ts";
import { QUESTION_TIME_LIMIT } from "../game/game-state.ts";
import { ProgressLadder } from "./ProgressLadder.tsx";

type HotSeatScreenProps = {
  runNumber: number;
  questionNumber: number;
  totalQuestions: number;
  question: Question;
  currentStep: LadderStep | null;
  currentRank: number;
  highestClearedRank: number;
  selectedAnswer: number | null;
  lockedAnswer: number | null;
  timeRemaining: number;
  phase: "active" | "suspense" | "reveal";
  revealResult: RevealResult | null;
  failureReason: FailureReason | null;
  pendingSecondChanceRecovery: boolean;
  lifelines: LifelineState;
  lifelineUsedOnCurrentQuestion: boolean;
  eliminatedAnswerIndexes: number[];
  onSelectAnswer: (answerIndex: number) => void;
  onLockAnswer: () => void;
  onUseFiftyFifty: () => void;
  onUseExtraTime: () => void;
  onUseSecondChance: () => void;
  outcome: "eliminated" | "completed" | null;
};

function formatTime(value: number) {
  return `00:${String(value).padStart(2, "0")}`;
}

function getAnswerLetter(answerIndex: number | null) {
  return answerIndex === null ? "--" : String.fromCharCode(65 + answerIndex);
}

export function HotSeatScreen(props: HotSeatScreenProps) {
  const {
    runNumber,
    questionNumber,
    totalQuestions,
    question,
    currentStep,
    currentRank,
    highestClearedRank,
    selectedAnswer,
    lockedAnswer,
    timeRemaining,
    phase,
    revealResult,
    failureReason,
    pendingSecondChanceRecovery,
    lifelines,
    lifelineUsedOnCurrentQuestion,
    eliminatedAnswerIndexes,
    onSelectAnswer,
    onLockAnswer,
    onUseFiftyFifty,
    onUseExtraTime,
    onUseSecondChance,
    outcome
  } = props;

  const correctIndex = question.correctIndex;
  const selectedLetter = getAnswerLetter(selectedAnswer);
  const lockedLetter = getAnswerLetter(lockedAnswer);
  const timerTone =
    phase === "active"
      ? timeRemaining <= 5
        ? "is-critical"
        : timeRemaining <= 10
          ? "is-warning"
          : "is-live"
      : phase === "suspense"
        ? "is-frozen"
        : failureReason === "timeout"
          ? "is-expired"
          : "is-frozen";
  const timerLabel =
    phase === "active"
      ? timeRemaining <= 5
        ? "Critical"
        : timeRemaining <= 10
          ? "Warning"
          : "Live"
      : phase === "suspense"
        ? "Frozen"
        : failureReason === "timeout"
          ? "Expired"
          : "Locked";
  const timerDetail =
    phase === "active"
      ? `${timeRemaining}s remaining`
      : phase === "suspense"
        ? "Hold"
        : failureReason === "timeout"
          ? "No lock"
          : revealResult === "correct"
            ? "Advance"
            : "Result";
  const timerStyle = {
    "--timer-progress": `${(timeRemaining / QUESTION_TIME_LIMIT) * 100}%`
  } as CSSProperties;
  const stageToneClass =
    phase === "suspense"
      ? "is-suspense"
      : phase === "reveal"
        ? revealResult === "correct"
          ? "is-reveal-correct"
          : "is-reveal-incorrect"
        : "is-live";
  const decisionLabel =
    phase === "active"
      ? selectedAnswer === null
        ? "No answer primed"
        : `Answer ${selectedLetter} primed`
      : phase === "suspense"
        ? `Answer ${lockedLetter} locked`
        : revealResult === "correct"
          ? `Answer ${lockedLetter} confirmed`
          : failureReason === "timeout"
            ? "No answer locked"
            : `Answer ${lockedLetter} broke`;
  const stateTitle =
    phase === "active"
      ? "Read window open"
      : phase === "suspense"
        ? "Verdict loading"
        : revealResult === "correct"
          ? "Read confirmed"
          : failureReason === "timeout"
            ? "Time expired"
            : "Run interrupted";
  const ctaLabel =
    phase === "active"
      ? "Lock Answer"
      : phase === "suspense"
        ? "Locked In"
        : revealResult === "correct"
          ? questionNumber === totalQuestions
            ? "Run Secured"
            : "Advancing"
          : "Ending Run";
  const shouldMaskCorrectReveal = phase === "reveal" && pendingSecondChanceRecovery;
  const questionProgressPercent = Math.round((questionNumber / Math.max(totalQuestions, 1)) * 100);
  const hasSelectedAnswer = selectedAnswer !== null;

  return (
    <section className={["screen", "hot-seat-screen", stageToneClass].join(" ")}>
      <div className={["game-shell", stageToneClass].join(" ")}>
        <div className="status-bar">
          <div className="status-copy">
            <div className="status-row">
              <div className="status-title">Hot Seat</div>
              <div className={["status-pill", stageToneClass].join(" ")}>
                {phase === "active"
                  ? "Live"
                  : phase === "suspense"
                    ? "Suspense"
                    : revealResult === "correct"
                      ? "Confirmed"
                      : "Break"}
              </div>
            </div>
            <div className="status-meta">
              RUN {String(runNumber).padStart(2, "0")}
            </div>
            <div className="status-progress" aria-label={`Question progress ${questionProgressPercent}%`}>
              <div className="status-progress-fill" style={{ width: `${questionProgressPercent}%` }} />
            </div>
          </div>

          <div className={["timer-card", timerTone].join(" ")} style={timerStyle}>
            <div className="timer-topline">
              <span>{timerLabel}</span>
              <span>{timerDetail}</span>
            </div>
            <strong>{formatTime(timeRemaining)}</strong>
            <div className="timer-track">
              <div className="timer-fill" />
            </div>
          </div>
        </div>

        <div className="question-layout">
          <div className="play-stage">
            <div className="question-card">
              <div className="question-topline">
                <span>{question.category}</span>
                <span>{currentStep?.pulse}</span>
              </div>
              <div className="question-rank">{currentStep?.code}</div>
              <h2>{question.prompt}</h2>
              <p className="question-subcopy">
                {phase === "active"
                  ? "Choose. Lock. Hold your nerve."
                  : phase === "suspense"
                    ? "The locked read is being tested."
                    : revealResult === "correct"
                      ? "Confirmed. Moving up."
                      : failureReason === "timeout"
                        ? "Time ran out."
                        : "The lock failed."}
              </p>
            </div>

            <div className={["answer-stack-shell", stageToneClass].join(" ")}>
              <div className={["answer-stack", phase].join(" ")}>
                {question.options.map((option, optionIndex) => {
                  const isSelected = phase === "active" && selectedAnswer === optionIndex;
                  const isEliminated = eliminatedAnswerIndexes.includes(optionIndex);
                  const isLocked = lockedAnswer === optionIndex;
                  const isCorrect = !shouldMaskCorrectReveal && revealResult !== null && optionIndex === correctIndex;
                  const isWrongPick =
                    revealResult === "incorrect" && lockedAnswer === optionIndex && optionIndex !== correctIndex;
                  const isDimmed =
                    (phase === "suspense" && lockedAnswer !== optionIndex) ||
                    (phase === "reveal" &&
                      ((revealResult === "correct" && optionIndex !== correctIndex) ||
                        (revealResult === "incorrect" && !isCorrect && !isWrongPick)));
                  const answerTag =
                    phase === "active" && isSelected
                      ? "Primed"
                      : phase === "suspense" && isLocked
                        ? "Locked"
                        : phase === "reveal" && isCorrect
                          ? failureReason === "timeout"
                            ? "Correct Answer"
                            : "Correct"
                      : phase === "reveal" && isWrongPick
                            ? "Your Pick"
                            : phase === "active" && isEliminated
                              ? "Removed"
                            : "";

                  return (
                    <button
                      key={`${question.id}-${optionIndex}`}
                      type="button"
                      className={[
                        "answer-card",
                        isSelected ? "is-selected" : "",
                        isLocked ? "is-locked" : "",
                        isCorrect ? "is-correct" : "",
                        isWrongPick ? "is-wrong" : "",
                        isEliminated ? "is-eliminated" : "",
                        isDimmed ? "is-dimmed" : ""
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => onSelectAnswer(optionIndex)}
                      disabled={phase !== "active" || isEliminated}
                      aria-pressed={isSelected}
                    >
                      <span className="answer-index">{String.fromCharCode(65 + optionIndex)}</span>
                      <span className="answer-copy">{isEliminated ? "Option removed" : option}</span>
                      <span className="answer-tag">{answerTag}</span>
                    </button>
                  );
                })}
              </div>
              {phase === "suspense" ? <div className="suspense-scan" aria-hidden="true" /> : null}
            </div>

            <div
              className={[
                "state-panel",
                phase === "active" ? "is-hidden-active" : "",
                phase === "suspense" ? "is-visible" : "",
                phase === "reveal" ? "is-reveal" : ""
              ].join(" ")}
            >
              <span className="state-label">{stateTitle}</span>
              <p>
                {phase === "active"
                  ? "Select then lock."
                  : phase === "suspense"
                    ? "Answer locked."
                    : revealResult === "correct"
                      ? questionNumber === totalQuestions
                        ? "Final rung secured."
                        : "Advancing."
                      : pendingSecondChanceRecovery
                        ? "Shield triggered. Retry."
                        : failureReason === "timeout"
                          ? "Time expired."
                  : "Wrong read."}
              </p>
            </div>

            <div className={["action-dock", hasSelectedAnswer ? "is-sticky" : ""].filter(Boolean).join(" ")} aria-label="Primary answer controls">
              <div className="action-zone">
                <button
                  className={[
                    "primary-cta",
                    "hot-seat-cta",
                    phase === "active" && selectedAnswer === null ? "is-disabled" : "",
                    phase === "suspense" ? "is-quiet" : "",
                    phase === "reveal" && revealResult === "incorrect" ? "is-danger" : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  type="button"
                  onClick={phase === "active" ? onLockAnswer : undefined}
                  disabled={phase !== "active" || selectedAnswer === null}
                >
                  {ctaLabel}
                </button>
              </div>

              <div className="action-utility-row">
                <div className={["decision-readout", stageToneClass].join(" ")}>
                  <strong>{decisionLabel}</strong>
                </div>

                <p className="lifeline-meta">1 lifeline per question</p>
              </div>

              <div className="lifeline-strip">
                <button
                  type="button"
                  className={["lifeline-chip", lifelines.fiftyFifty ? "" : "is-spent"].filter(Boolean).join(" ")}
                  onClick={onUseFiftyFifty}
                  disabled={phase !== "active" || !lifelines.fiftyFifty || lifelineUsedOnCurrentQuestion}
                >
                  50:50
                </button>
                <button
                  type="button"
                  className={["lifeline-chip", lifelines.extraTime ? "" : "is-spent"].filter(Boolean).join(" ")}
                  onClick={onUseExtraTime}
                  disabled={phase !== "active" || !lifelines.extraTime || lifelineUsedOnCurrentQuestion}
                >
                  +10s
                </button>
                <button
                  type="button"
                  className={[
                    "lifeline-chip",
                    lifelines.secondChance ? "" : "is-spent",
                    lifelines.secondChanceArmed ? "is-armed" : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={onUseSecondChance}
                  disabled={
                    phase !== "active" ||
                    !lifelines.secondChance ||
                    lifelines.secondChanceArmed ||
                    lifelineUsedOnCurrentQuestion
                  }
                >
                  {lifelines.secondChanceArmed ? "Shield Armed" : "Second Chance"}
                </button>
              </div>
            </div>
          </div>

          <ProgressLadder
            currentStepCode={currentStep?.code ?? "--"}
            currentStepLabel={currentStep?.label ?? "Threshold"}
            currentRank={currentRank}
            highestClearedRank={highestClearedRank}
            revealResult={revealResult}
            phase={phase}
            outcome={outcome}
          />
        </div>
      </div>
    </section>
  );
}
