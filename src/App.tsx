import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { HotSeatScreen } from "./components/HotSeatScreen.tsx";
import { LandingScreen } from "./components/LandingScreen.tsx";
import { ResultScreen } from "./components/ResultScreen.tsx";
import { AuthSheet } from "./features/auth/AuthSheet.tsx";
import { useAuth } from "./features/auth/AuthProvider.tsx";
import type { PendingRunBridge } from "./domain/persistence.ts";
import { deriveInsightSummary } from "./domain/insights.ts";
import {
  buildRunBehaviorSummary,
  createTransientQuestionCapture,
  finalizeQuestionBehaviorSignal,
  recordLock,
  recordSelection,
  type QuestionBehaviorSignal,
  type RunBehaviorSummary,
  type TransientQuestionCapture
} from "./domain/player-model.ts";
import { getStepByRank, PROGRESSION_LADDER } from "./domain/progression.ts";
import {
  gameReducer,
  createInitialGameState,
  getBestReserve,
  getCorrectCount,
  getCurrentTargetRank,
  getHighestClearedRank,
  REVEAL_DWELL_MS,
  SUSPENSE_DURATION_MS
} from "./game/game-state.ts";
import { listActiveQuestions } from "./lib/supabase/repositories.ts";
import { selectNextAdaptiveQuestionId } from "./game/adaptive-selection.ts";
import { getRecentRunAvoidIds, storeRecentRunQuestionIds } from "./game/recent-run-memory.ts";
import { QUESTION_SET_VERSION, SEEDED_QUESTIONS } from "./seed/questions.ts";
import {
  createRunQuestionCatalog,
  createSeedQuestionCatalog,
  getFallbackNextQuestionId,
  getInitialQuestionId,
  getQuestionForState,
  LIVE_QUESTION_SET_VERSION,
  selectPlayableQuestionCatalog,
  type QuestionCatalog
} from "./game/question-catalog.ts";

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialGameState);
  const {
    isConfigured,
    session,
    profile,
    playerModel,
    recentRuns,
    isAuthSheetOpen,
    requestedEmail,
    saveState,
    openSaveSheet,
    closeAuthSheet,
    sendMagicLink,
    persistCompletedRun,
    resetSaveState
  } =
    useAuth();
  const [availableCatalog, setAvailableCatalog] = useState<QuestionCatalog>(() => createSeedQuestionCatalog());
  const [runCatalog, setRunCatalog] = useState<QuestionCatalog | null>(null);
  const recentRunQuestionIdsRef = useRef<string[]>(getRecentRunAvoidIds());
  const runStartedAtRef = useRef<string | null>(null);
  const storedRunMemoryKeyRef = useRef<string | null>(null);
  const completedRunRef = useRef<PendingRunBridge | null>(null);
  const questionCaptureRef = useRef<TransientQuestionCapture | null>(null);
  const capturedRecordKeyRef = useRef<string | null>(null);
  const [questionBehaviorSignals, setQuestionBehaviorSignals] = useState<QuestionBehaviorSignal[]>([]);
  const activeCatalog = runCatalog ?? availableCatalog;
  const questionsById = useMemo(
    () => new Map(activeCatalog.questions.map((question) => [question.id, question])),
    [activeCatalog.questions]
  );
  const currentQuestion = useMemo(
    () =>
      state.phase === "entry"
        ? activeCatalog.questions[0] ?? SEEDED_QUESTIONS[0]
        : getQuestionForState(state, questionsById),
    [activeCatalog.questions, questionsById, state]
  );

  useEffect(() => {
    let isCancelled = false;

    if (!isConfigured) {
      setAvailableCatalog(createSeedQuestionCatalog());
      return undefined;
    }

    void listActiveQuestions(LIVE_QUESTION_SET_VERSION)
      .then((contentQuestions) => {
        if (isCancelled) {
          return;
        }

        setAvailableCatalog(selectPlayableQuestionCatalog(contentQuestions));
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        setAvailableCatalog(createSeedQuestionCatalog());
      });

    return () => {
      isCancelled = true;
    };
  }, [isConfigured]);

  useEffect(() => {
    if (state.phase !== "active") {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      dispatch({ type: "TICK" });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [state.phase, state.questionIndex]);

  useEffect(() => {
    if (state.phase !== "suspense") {
      return undefined;
    }

    const suspenseId = window.setTimeout(() => {
      dispatch({ type: "RESOLVE_SUSPENSE", correctIndex: currentQuestion.correctIndex });
    }, SUSPENSE_DURATION_MS);

    return () => {
      window.clearTimeout(suspenseId);
    };
  }, [currentQuestion.correctIndex, state.phase, state.questionIndex, state.lockedAnswer]);

  useEffect(() => {
    if (state.phase !== "reveal") {
      return undefined;
    }

    const revealId = window.setTimeout(() => {
      const shouldAdaptNextQuestion =
        state.revealResult === "correct" && state.questionIndex < state.questionCount - 1;

      if (!shouldAdaptNextQuestion) {
        dispatch({ type: "CONTINUE" });
        return;
      }

      const nextQuestionId = selectNextAdaptiveQuestionId({
        state,
        playerModel,
        questions: activeCatalog.questions
      });

      dispatch({
        type: "CONTINUE",
        nextQuestionId: nextQuestionId ?? getFallbackNextQuestionId(state.questionOrder, activeCatalog.questions) ?? undefined
      });
    }, REVEAL_DWELL_MS);

    return () => {
      window.clearTimeout(revealId);
    };
  }, [activeCatalog.questions, playerModel, state, state.failureReason, state.outcome, state.phase, state.questionCount, state.questionIndex, state.revealResult]);

  useEffect(() => {
    const isFreshRun =
      state.phase === "active" &&
      state.questionIndex === 0 &&
      state.answerLog.length === 0 &&
      state.selectedAnswer === null &&
      state.lockedAnswer === null;

    if (!isFreshRun) {
      return;
    }

    runStartedAtRef.current = new Date().toISOString();
    completedRunRef.current = null;
    questionCaptureRef.current = null;
    capturedRecordKeyRef.current = null;
    storedRunMemoryKeyRef.current = null;
    setQuestionBehaviorSignals([]);
  }, [state.answerLog.length, state.lockedAnswer, state.phase, state.questionIndex, state.runNumber, state.selectedAnswer]);

  useEffect(() => {
    if (state.phase !== "result" || !runCatalog) {
      return;
    }

    const memoryKey = `${state.runNumber}:${runCatalog.questionSetVersion}:${runCatalog.questions[0]?.id ?? "none"}`;
    if (storedRunMemoryKeyRef.current === memoryKey) {
      return;
    }

    const runQuestionIds = runCatalog.questions.map((question) => question.id);
    storeRecentRunQuestionIds(runQuestionIds);
    recentRunQuestionIdsRef.current = runQuestionIds;
    storedRunMemoryKeyRef.current = memoryKey;
  }, [runCatalog, state.phase, state.runNumber]);

  useEffect(() => {
    if (state.phase !== "active") {
      return;
    }

    const question = getQuestionForState(state, questionsById);
    questionCaptureRef.current = createTransientQuestionCapture({
      questionId: question.id,
      questionRank: getCurrentTargetRank(state),
      category: question.category,
      activatedAtMs: Date.now()
    });
    capturedRecordKeyRef.current = null;
  }, [questionsById, state.phase, state.questionIndex, state.runNumber]);

  useEffect(() => {
    if (state.phase !== "active" || state.selectedAnswer === null || !questionCaptureRef.current) {
      return;
    }

    questionCaptureRef.current = recordSelection(questionCaptureRef.current, {
      answerIndex: state.selectedAnswer,
      selectedAtMs: Date.now()
    });
  }, [state.phase, state.selectedAnswer]);

  useEffect(() => {
    if (state.phase !== "suspense" || state.lockedAnswer === null || !questionCaptureRef.current) {
      return;
    }

    questionCaptureRef.current = recordLock(questionCaptureRef.current, {
      lockedAnswerIndex: state.lockedAnswer,
      lockedAtMs: Date.now(),
      timeRemainingAtLock: state.timeRemaining
    });
  }, [state.lockedAnswer, state.phase, state.questionIndex, state.timeRemaining]);

  useEffect(() => {
    if (state.phase !== "reveal" || !state.lastRecord || !questionCaptureRef.current) {
      return;
    }

    const captureKey = `${state.runNumber}:${state.lastRecord.questionId}:${state.lastRecord.result}`;

    if (capturedRecordKeyRef.current === captureKey) {
      return;
    }

    const question = getQuestionForState(state, questionsById);
    const signal = finalizeQuestionBehaviorSignal(questionCaptureRef.current, {
      result: state.lastRecord.result,
      correctAnswerIndex: question.correctIndex,
      selectedAnswerIndex: state.lastRecord.selectedAnswer,
      lockedAnswerIndex: state.lastRecord.lockedAnswer,
      resolvedAtMs: Date.now()
    });

    setQuestionBehaviorSignals((currentSignals) => [...currentSignals, signal]);
    capturedRecordKeyRef.current = captureKey;
  }, [questionsById, state.lastRecord, state.phase, state.questionIndex, state.runNumber]);

  const currentRank = getCurrentTargetRank(state);
  const highestClearedRank = getHighestClearedRank(state);
  const correctCount = getCorrectCount(state);
  const bestReserve = getBestReserve(state);
  const runBehaviorSummary = useMemo(
    () => buildRunBehaviorSummary(questionBehaviorSignals),
    [questionBehaviorSignals]
  );
  const insightSummary = useMemo(() => {
    if (state.phase !== "result" || !state.outcome) {
      return { primary: null, secondary: null };
    }

    return deriveInsightSummary({
      runSummary: runBehaviorSummary,
      questionSignals: questionBehaviorSignals,
      playerModel,
      resultContext: {
        outcome: state.outcome,
        failureReason: state.failureReason,
        highestRank: highestClearedRank,
        correctAnswers: correctCount,
        totalQuestions: state.questionCount
      }
    });
  }, [
    correctCount,
    highestClearedRank,
    playerModel,
    questionBehaviorSignals,
    runBehaviorSummary,
    state.failureReason,
    state.outcome,
    state.phase,
    state.questionCount
  ]);

  const completedRun = useMemo(() => {
    if (state.phase !== "result" || !state.outcome) {
      return null;
    }

    if (completedRunRef.current) {
      return completedRunRef.current;
    }

    const startedAt = runStartedAtRef.current ?? new Date().toISOString();
    const run: PendingRunBridge = {
      localRunKey: `run-${state.runNumber}-${startedAt}`,
      startedAt,
      completedAt: new Date().toISOString(),
      outcome: state.outcome,
      highestRank: highestClearedRank,
      correctAnswers: correctCount,
      totalQuestions: state.questionCount,
      failureReason: state.failureReason,
      bestReserveSeconds: bestReserve,
      questionSetVersion: runCatalog?.questionSetVersion ?? QUESTION_SET_VERSION,
      avgResponseTimeMs: runBehaviorSummary.averageResponseTimeMs,
      avgFirstSelectionTimeMs: runBehaviorSummary.averageFirstSelectionTimeMs,
      selectionChangeRate: runBehaviorSummary.selectionChangeRate,
      pressureMissCount: runBehaviorSummary.pressureMissCount,
      timeoutCount: runBehaviorSummary.timeoutCount,
      categorySummary: runBehaviorSummary.categoryBreakdown,
      behaviorSummary: runBehaviorSummary,
      questionSignals: questionBehaviorSignals
    };

    completedRunRef.current = run;
    return run;
  }, [bestReserve, correctCount, highestClearedRank, questionBehaviorSignals, runBehaviorSummary, runCatalog?.questionSetVersion, state.failureReason, state.outcome, state.phase, state.questionCount, state.runNumber]);

  const handleStartRun = () => {
    resetSaveState();
    const nextCatalog = createRunQuestionCatalog({
      catalog: availableCatalog,
      runNumber: state.runNumber,
      recentlyUsedQuestionIds: recentRunQuestionIdsRef.current
    });
    setRunCatalog(nextCatalog);
    recentRunQuestionIdsRef.current = nextCatalog.questions.map((question) => question.id);
    dispatch({
      type: "START_RUN",
      firstQuestionId: getInitialQuestionId(nextCatalog),
      questionCount: nextCatalog.runQuestionCount
    });
  };

  const handleReplay = () => {
    resetSaveState();
    const nextCatalog = createRunQuestionCatalog({
      catalog: availableCatalog,
      runNumber: state.runNumber + 1,
      recentlyUsedQuestionIds: recentRunQuestionIdsRef.current
    });
    setRunCatalog(nextCatalog);
    recentRunQuestionIdsRef.current = nextCatalog.questions.map((question) => question.id);
    dispatch({
      type: "REPLAY",
      firstQuestionId: getInitialQuestionId(nextCatalog),
      questionCount: nextCatalog.runQuestionCount
    });
  };

  useEffect(() => {
    if (!session?.user.id || !completedRun) {
      return;
    }

    void persistCompletedRun(completedRun);
  }, [completedRun, persistCompletedRun, session]);
  const appPhaseClassName = [
    "app-shell",
    `phase-${state.phase}`,
    state.phase === "reveal" && state.revealResult ? `reveal-${state.revealResult}` : "",
    state.phase === "result" && state.outcome ? `result-${state.outcome}` : ""
  ]
    .filter(Boolean)
    .join(" ");
  const sourceLabel = activeCatalog.source === "supabase" ? "Live Question Run" : "Seed Fallback Run";

  return (
    <main className={appPhaseClassName}>
      <div className="app-backdrop" />
      <div className="app-noise" />

      {state.phase === "entry" ? (
        <LandingScreen
          onStart={handleStartRun}
          signedInEmail={session?.user.email ?? null}
          profile={profile}
          recentRuns={recentRuns}
          authStatusMessage={
            saveState.status === "saved"
              ? "Latest run secured to your account."
              : saveState.status === "error"
                ? saveState.message
                : null
          }
        />
      ) : null}

      {state.phase === "active" || state.phase === "suspense" || state.phase === "reveal" ? (
        <HotSeatScreen
          runNumber={state.runNumber}
          questionNumber={state.questionIndex + 1}
          totalQuestions={state.questionCount}
          question={currentQuestion}
          currentStep={getStepByRank(currentRank)}
          currentRank={currentRank}
          highestClearedRank={highestClearedRank}
          selectedAnswer={state.selectedAnswer}
          lockedAnswer={state.lockedAnswer}
          timeRemaining={state.timeRemaining}
          phase={state.phase}
          revealResult={state.revealResult}
          failureReason={state.failureReason}
          pendingSecondChanceRecovery={state.pendingSecondChanceRecovery}
          lifelines={state.lifelines}
          lifelineUsedOnCurrentQuestion={state.lifelineUsedOnCurrentQuestion}
          eliminatedAnswerIndexes={state.eliminatedAnswerIndexes}
          onSelectAnswer={(answerIndex) => dispatch({ type: "SELECT_ANSWER", answerIndex })}
          onLockAnswer={() => dispatch({ type: "LOCK_ANSWER" })}
          onUseFiftyFifty={() => dispatch({ type: "USE_LIFELINE_50_50", correctIndex: currentQuestion.correctIndex })}
          onUseExtraTime={() => dispatch({ type: "USE_LIFELINE_EXTRA_TIME" })}
          onUseSecondChance={() => dispatch({ type: "USE_LIFELINE_SECOND_CHANCE" })}
          outcome={state.outcome}
        />
      ) : null}

      {state.phase === "result" && state.outcome ? (
        <ResultScreen
          outcome={state.outcome}
          highestClearedRank={highestClearedRank}
          correctCount={correctCount}
          totalQuestions={state.questionCount}
          bestReserve={bestReserve}
          failureReason={state.failureReason}
          onReplay={handleReplay}
          canSaveRun={Boolean(completedRun) && !session}
          saveState={saveState.status}
          saveMessage={saveState.message}
          signedInEmail={session?.user.email ?? null}
          insightSummary={insightSummary}
          isSaveConfigured={isConfigured}
          onSaveRun={
            completedRun
              ? () => {
                  openSaveSheet(completedRun);
                }
              : undefined
          }
        />
      ) : null}

      <AuthSheet
        isConfigured={isConfigured}
        isOpen={isAuthSheetOpen}
        requestedEmail={requestedEmail}
        saveStateStatus={saveState.status}
        saveMessage={saveState.message}
        onClose={closeAuthSheet}
        onSubmit={sendMagicLink}
      />

      <footer className="app-footer">
        <span>{`Mind Reader Mode // ${sourceLabel}`}</span>
        <span>{PROGRESSION_LADDER.length} rung pressure ladder</span>
      </footer>
    </main>
  );
}
