import type { CSSProperties } from "react";
import type { FailureReason, LadderStep, Question, RevealResult } from "../domain/game.ts";
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
  onSelectAnswer: (answerIndex: number) => void;
  onLockAnswer: () => void;
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
    onSelectAnswer,
    onLockAnswer,
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
        ? "Critical window"
        : timeRemaining <= 10
          ? "Pressure rising"
          : "Timer live"
      : phase === "suspense"
        ? "Timer frozen"
        : failureReason === "timeout"
          ? "Timer expired"
          : "Verdict locked";
  const timerDetail =
    phase === "active"
      ? `${timeRemaining}s remaining`
      : phase === "suspense"
        ? "Decision held"
        : failureReason === "timeout"
          ? "No lock recorded"
          : revealResult === "correct"
            ? questionNumber === totalQuestions
              ? "Run closure incoming"
              : "Next question loading"
            : "Result transition incoming";
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
              RUN {String(runNumber).padStart(2, "0")} | Q {String(questionNumber).padStart(2, "0")} /{" "}
              {String(totalQuestions).padStart(2, "0")}
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
                  ? "Pick your read carefully. The timer only stops when you commit."
                  : phase === "suspense"
                    ? "The room goes quiet while the locked read is tested."
                    : revealResult === "correct"
                      ? "The answer held under pressure. The ladder opens upward."
                      : failureReason === "timeout"
                        ? "The window closed before the answer became real."
                        : "The locked read failed and the run snapped shut."}
              </p>
            </div>

            <div className={["answer-stack-shell", stageToneClass].join(" ")}>
              <div className={["answer-stack", phase].join(" ")}>
                {question.options.map((option, optionIndex) => {
                  const isSelected = phase === "active" && selectedAnswer === optionIndex;
                  const isLocked = lockedAnswer === optionIndex;
                  const isCorrect = revealResult !== null && optionIndex === correctIndex;
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
                        isDimmed ? "is-dimmed" : ""
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => onSelectAnswer(optionIndex)}
                      disabled={phase !== "active"}
                      aria-pressed={isSelected}
                    >
                      <span className="answer-index">{String.fromCharCode(65 + optionIndex)}</span>
                      <span className="answer-copy">{option}</span>
                      <span className="answer-tag">{answerTag}</span>
                    </button>
                  );
                })}
              </div>
              {phase === "suspense" ? <div className="suspense-scan" aria-hidden="true" /> : null}
            </div>

            <div className={["state-panel", phase === "suspense" ? "is-visible" : "", phase === "reveal" ? "is-reveal" : ""].join(" ")}>
              <span className="state-label">{stateTitle}</span>
              {phase === "active" ? (
                <p>Select an answer, then lock it in. The clock only stops when you commit.</p>
              ) : null}
              {phase === "suspense" ? (
                <p>Answer locked. Timer frozen. Hold the line.</p>
              ) : null}
              {phase === "reveal" && revealResult === "correct" ? (
                <p>{questionNumber === totalQuestions ? "Read confirmed. Final rung secured." : "Read confirmed. Advancing automatically."}</p>
              ) : null}
              {phase === "reveal" && revealResult === "incorrect" ? (
                <p>{failureReason === "timeout" ? "Time expired. Moving to the run result." : "False read. Moving to the run result."}</p>
              ) : null}
            </div>

            <div className="action-zone">
              <div className={["decision-readout", stageToneClass].join(" ")}>
                <span>Decision</span>
                <strong>{decisionLabel}</strong>
              </div>
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
