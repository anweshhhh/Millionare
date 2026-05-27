import {
  buildPlayerModelSnapshot,
  type CategoryModelSnapshot,
  type PlayerModelSnapshot,
  type PlayerModelStyle,
  type QuestionBehaviorSignal
} from "../../domain/player-model.ts";
import { mapActiveQuestionRows, type ContentQuestion } from "../../domain/content.ts";
import type { Json } from "./database.types.ts";
import type { Database } from "./database.types.ts";
import type {
  PendingRunBridge,
  PersistedPlayerModel,
  PersistedQuestionBehaviorSignal,
  PersistedRun,
  PersistedRunInsert,
  ProfileSummary
} from "../../domain/persistence.ts";
import { getSupabaseBrowserClient } from "./client.ts";
import type { SupabaseClient } from "@supabase/supabase-js";

export const RECENT_RUN_LIMIT = 5;

function asCategorySummary(value: Json | null): PersistedRun["categorySummary"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as PersistedRun["categorySummary"];
}

function asCategorySnapshot(value: Json | null): Record<string, CategoryModelSnapshot> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, CategoryModelSnapshot>;
}

function asPlayerModelStyle(value: string): PlayerModelStyle {
  return value as PlayerModelStyle;
}

function mapProfileSummary(data: {
  user_id: string;
  created_at: string;
  updated_at: string;
  display_name: string | null;
  best_score_rank: number;
  current_streak: number;
  last_played_at: string | null;
  best_run_id: string | null;
}) {
  const profile: ProfileSummary = {
    userId: data.user_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    displayName: data.display_name,
    bestScoreRank: data.best_score_rank,
    currentStreak: data.current_streak,
    lastPlayedAt: data.last_played_at,
    bestRunId: data.best_run_id
  };

  return profile;
}

function mapPersistedRun(data: {
  id: string;
  user_id: string;
  created_at: string;
  started_at: string;
  completed_at: string;
  outcome: PersistedRun["outcome"];
  highest_rank: number;
  correct_answers: number;
  total_questions: number;
  failure_reason: PersistedRun["failureReason"];
  best_reserve_seconds: number | null;
  question_set_version: string;
  avg_response_time_ms: number | null;
  avg_first_selection_time_ms: number | null;
  selection_change_rate: number | null;
  pressure_miss_count: number | null;
  timeout_count: number | null;
  category_summary: Json | null;
}) {
  const persistedRun: PersistedRun = {
    id: data.id,
    userId: data.user_id,
    createdAt: data.created_at,
    startedAt: data.started_at,
    completedAt: data.completed_at,
    outcome: data.outcome,
    highestRank: data.highest_rank,
    correctAnswers: data.correct_answers,
    totalQuestions: data.total_questions,
    failureReason: data.failure_reason,
    bestReserveSeconds: data.best_reserve_seconds,
    questionSetVersion: data.question_set_version,
    avgResponseTimeMs: data.avg_response_time_ms,
    avgFirstSelectionTimeMs: data.avg_first_selection_time_ms,
    selectionChangeRate: data.selection_change_rate,
    pressureMissCount: data.pressure_miss_count ?? 0,
    timeoutCount: data.timeout_count ?? 0,
    categorySummary: asCategorySummary(data.category_summary)
  };

  return persistedRun;
}

function mapPersistedPlayerModel(data: {
  user_id: string;
  created_at: string;
  updated_at: string;
  runs_observed: number;
  questions_observed: number;
  accuracy_rate: number;
  timeout_rate: number;
  avg_response_time_ms: number | null;
  avg_first_selection_time_ms: number | null;
  avg_selection_change_count: number;
  pressure_accuracy_rate: number;
  pressure_timeout_rate: number;
  confidence_style: string;
  hesitation_style: string;
  pressure_style: string;
  category_snapshot: Json | null;
  model_version: string;
}) {
  const model: PersistedPlayerModel = {
    userId: data.user_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    runsObserved: data.runs_observed,
    questionsObserved: data.questions_observed,
    accuracyRate: Number(data.accuracy_rate),
    timeoutRate: Number(data.timeout_rate),
    avgResponseTimeMs: data.avg_response_time_ms,
    avgFirstSelectionTimeMs: data.avg_first_selection_time_ms,
    avgSelectionChangeCount: Number(data.avg_selection_change_count),
    pressureAccuracyRate: Number(data.pressure_accuracy_rate),
    pressureTimeoutRate: Number(data.pressure_timeout_rate),
    confidenceStyle: asPlayerModelStyle(data.confidence_style),
    hesitationStyle: asPlayerModelStyle(data.hesitation_style),
    pressureStyle: asPlayerModelStyle(data.pressure_style),
    categorySnapshot: asCategorySnapshot(data.category_snapshot),
    modelVersion: data.model_version
  };

  return model;
}

function mapPersistedQuestionSignal(data: {
  id: string;
  run_id: string;
  user_id: string;
  question_id: string;
  question_rank: number;
  category: string;
  result: QuestionBehaviorSignal["result"];
  correct_answer_index: number;
  selected_answer_index: number | null;
  locked_answer_index: number | null;
  response_time_ms: number;
  first_selection_time_ms: number | null;
  selection_change_count: number;
  time_remaining_at_lock: number | null;
  locked_with_under_5s: boolean;
  timed_out_without_lock: boolean;
  created_at: string;
}) {
  const signal: PersistedQuestionBehaviorSignal = {
    id: data.id,
    runId: data.run_id,
    userId: data.user_id,
    questionId: data.question_id,
    questionRank: data.question_rank,
    category: data.category,
    result: data.result,
    correctAnswerIndex: data.correct_answer_index,
    selectedAnswerIndex: data.selected_answer_index,
    lockedAnswerIndex: data.locked_answer_index,
    responseTimeMs: data.response_time_ms,
    firstSelectionTimeMs: data.first_selection_time_ms,
    selectionChangeCount: data.selection_change_count,
    timeRemainingAtLock: data.time_remaining_at_lock,
    lockedWithUnder5s: data.locked_with_under_5s,
    timedOutWithoutLock: data.timed_out_without_lock,
    createdAt: data.created_at
  };

  return signal;
}

function requireClient() {
  const client = getSupabaseBrowserClient();

  if (!client) {
    throw new Error("Supabase client is not configured.");
  }

  return client;
}

export async function listActiveQuestions(questionSetVersion?: string): Promise<ContentQuestion[]> {
  const client = requireClient();
  return listActiveQuestionsWithClient(client, questionSetVersion);
}

export async function listActiveQuestionsWithClient(
  client: SupabaseClient<Database>,
  questionSetVersion?: string
): Promise<ContentQuestion[]> {
  let query = client.from("questions").select("*").eq("is_active", true).order("external_key", { ascending: true });

  if (questionSetVersion) {
    query = query.eq("question_set_version", questionSetVersion);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return mapActiveQuestionRows(data ?? []);
}

export async function fetchProfileSummary(userId: string) {
  const client = requireClient();
  const { data, error } = await client.from("profiles").select("*").eq("user_id", userId).maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapProfileSummary(data);
}

export async function insertRun(run: PersistedRunInsert) {
  const client = requireClient();
  const { data, error } = await client.from("runs").insert({
    user_id: run.userId,
    started_at: run.startedAt,
    completed_at: run.completedAt,
    outcome: run.outcome,
    highest_rank: run.highestRank,
    correct_answers: run.correctAnswers,
    total_questions: run.totalQuestions,
    failure_reason: run.failureReason,
    best_reserve_seconds: run.bestReserveSeconds,
    question_set_version: run.questionSetVersion,
    avg_response_time_ms: run.avgResponseTimeMs,
    avg_first_selection_time_ms: run.avgFirstSelectionTimeMs,
    selection_change_rate: run.selectionChangeRate,
    pressure_miss_count: run.pressureMissCount,
    timeout_count: run.timeoutCount,
    category_summary: run.categorySummary
  }).select("*").single();

  if (error) {
    throw error;
  }

  return mapPersistedRun(data);
}

export async function fetchPlayerModel(userId: string) {
  const client = requireClient();
  const { data, error } = await client.from("player_models").select("*").eq("user_id", userId).maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapPersistedPlayerModel(data) : null;
}

export async function fetchQuestionSignalsForUser(userId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from("run_question_signals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapPersistedQuestionSignal);
}

export async function fetchRecentRuns(userId: string, limit = RECENT_RUN_LIMIT) {
  const client = requireClient();
  const { data, error } = await client
    .from("runs")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapPersistedRun);
}

export async function upsertProfileSummary(profile: {
  userId: string;
  displayName: string | null;
  bestScoreRank: number;
  currentStreak: number;
  lastPlayedAt: string | null;
  bestRunId: string | null;
}) {
  const client = requireClient();
  const { data, error } = await client
    .from("profiles")
    .upsert(
      {
        user_id: profile.userId,
        display_name: profile.displayName,
        best_score_rank: profile.bestScoreRank,
        current_streak: profile.currentStreak,
        last_played_at: profile.lastPlayedAt,
        best_run_id: profile.bestRunId
      },
      {
        onConflict: "user_id"
      }
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapProfileSummary(data);
}

export async function insertRunQuestionSignals(input: {
  runId: string;
  userId: string;
  signals: QuestionBehaviorSignal[];
}) {
  const client = requireClient();
  if (input.signals.length === 0) {
    return [];
  }
  const { data, error } = await client
    .from("run_question_signals")
    .insert(
      input.signals.map((signal) => ({
        run_id: input.runId,
        user_id: input.userId,
        question_id: signal.questionId,
        question_rank: signal.questionRank,
        category: signal.category,
        result: signal.result,
        correct_answer_index: signal.correctAnswerIndex,
        selected_answer_index: signal.selectedAnswerIndex,
        locked_answer_index: signal.lockedAnswerIndex,
        response_time_ms: signal.responseTimeMs,
        first_selection_time_ms: signal.firstSelectionTimeMs,
        selection_change_count: signal.selectionChangeCount,
        time_remaining_at_lock: signal.timeRemainingAtLock,
        locked_with_under_5s: signal.lockedWithUnder5s,
        timed_out_without_lock: signal.timedOutWithoutLock
      }))
    )
    .select("*");

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapPersistedQuestionSignal);
}

export async function upsertPlayerModel(input: {
  userId: string;
  existingModel: PersistedPlayerModel | null;
  questionSignals: PersistedQuestionBehaviorSignal[];
}) {
  const client = requireClient();
  const nextSnapshot = buildPlayerModelSnapshot({
    questionSignals: input.questionSignals,
    runsObserved: input.existingModel?.runsObserved ?? 0
  });
  const { data, error } = await client
    .from("player_models")
    .upsert(
      {
        user_id: input.userId,
        runs_observed: nextSnapshot.runsObserved,
        questions_observed: nextSnapshot.questionsObserved,
        accuracy_rate: nextSnapshot.accuracyRate,
        timeout_rate: nextSnapshot.timeoutRate,
        avg_response_time_ms: nextSnapshot.avgResponseTimeMs,
        avg_first_selection_time_ms: nextSnapshot.avgFirstSelectionTimeMs,
        avg_selection_change_count: nextSnapshot.avgSelectionChangeCount,
        pressure_accuracy_rate: nextSnapshot.pressureAccuracyRate,
        pressure_timeout_rate: nextSnapshot.pressureTimeoutRate,
        confidence_style: nextSnapshot.confidenceStyle,
        hesitation_style: nextSnapshot.hesitationStyle,
        pressure_style: nextSnapshot.pressureStyle,
        category_snapshot: nextSnapshot.categorySnapshot,
        model_version: nextSnapshot.modelVersion
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapPersistedPlayerModel(data);
}

export async function saveCompletedRunForUser(input: {
  userId: string;
  displayName: string | null;
  run: PendingRunBridge;
}) {
  const { userId, displayName, run } = input;
  const [existingProfile, existingPlayerModel] = await Promise.all([
    fetchProfileSummary(userId),
    fetchPlayerModel(userId)
  ]);

  await upsertProfileSummary({
    userId,
    displayName: existingProfile?.displayName ?? displayName,
    bestScoreRank: existingProfile?.bestScoreRank ?? 0,
    currentStreak: existingProfile?.currentStreak ?? 0,
    lastPlayedAt: existingProfile?.lastPlayedAt ?? null,
    bestRunId: existingProfile?.bestRunId ?? null
  });

  const persistedRun = await insertRun({
    userId,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    outcome: run.outcome,
    highestRank: run.highestRank,
    correctAnswers: run.correctAnswers,
    totalQuestions: run.totalQuestions,
    failureReason: run.failureReason,
    bestReserveSeconds: run.bestReserveSeconds,
    questionSetVersion: run.questionSetVersion,
    avgResponseTimeMs: run.avgResponseTimeMs,
    avgFirstSelectionTimeMs: run.avgFirstSelectionTimeMs,
    selectionChangeRate: run.selectionChangeRate,
    pressureMissCount: run.pressureMissCount,
    timeoutCount: run.timeoutCount,
    categorySummary: run.categorySummary
  });

  const questionSignals = await insertRunQuestionSignals({
    runId: persistedRun.id,
    userId,
    signals: run.questionSignals
  });
  const allQuestionSignals = [...(await fetchQuestionSignalsForUser(userId)).filter((signal) => signal.runId !== persistedRun.id), ...questionSignals];
  const playerModel = await upsertPlayerModel({
    userId,
    existingModel: existingPlayerModel,
    questionSignals: allQuestionSignals
  });

  const nextBestScoreRank = Math.max(existingProfile?.bestScoreRank ?? 0, run.highestRank);
  const nextBestRunId =
    !existingProfile || run.highestRank > existingProfile.bestScoreRank
      ? persistedRun.id
      : existingProfile.bestRunId;

  const profile = await upsertProfileSummary({
    userId,
    displayName: existingProfile?.displayName ?? displayName,
    bestScoreRank: nextBestScoreRank,
    currentStreak: run.outcome === "completed" ? (existingProfile?.currentStreak ?? 0) + 1 : 0,
    lastPlayedAt: run.completedAt,
    bestRunId: nextBestRunId
  });

  return {
    profile,
    run: persistedRun,
    questionSignals,
    playerModel
  };
}
