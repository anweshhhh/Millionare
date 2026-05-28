import { toGameQuestion, type ContentQuestion } from "../domain/content.ts";
import type { Question } from "../domain/game.ts";
import { PROGRESSION_LADDER } from "../domain/progression.ts";
import { QUESTION_SET_VERSION, SEEDED_QUESTIONS } from "../seed/questions.ts";
import { getCurrentQuestionId } from "./game-state.ts";
import type { GameState } from "../domain/game.ts";

export const RUN_QUESTION_COUNT = PROGRESSION_LADDER.length;
export const LIVE_QUESTION_SET_VERSION = "launch-v1";
const MAX_CATEGORY_OCCURRENCES = 2;
const TARGET_PER_DIFFICULTY_BAND = 4;

export type QuestionCatalogSource = "seed" | "supabase";

export type QuestionCatalog = {
  source: QuestionCatalogSource;
  questionSetVersion: string;
  questions: Question[];
  runQuestionCount: number;
};

type SeededRandom = () => number;

export function createSeedQuestionCatalog(): QuestionCatalog {
  return {
    source: "seed",
    questionSetVersion: QUESTION_SET_VERSION,
    questions: SEEDED_QUESTIONS,
    runQuestionCount: Math.min(RUN_QUESTION_COUNT, SEEDED_QUESTIONS.length)
  };
}

function hasEnoughQuestions(questions: Question[]) {
  return questions.length >= RUN_QUESTION_COUNT;
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createSeededRandom(seedValue: string): SeededRandom {
  let state = hashString(seedValue) || 1;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffleWithSeed<T>(items: T[], random: SeededRandom) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = next[index];
    next[index] = next[swapIndex] as T;
    next[swapIndex] = current as T;
  }

  return next;
}

function pickQuestionsByDifficultyBand(input: {
  pool: Question[];
  random: SeededRandom;
  targetCount: number;
  selectedIds: Set<string>;
  selectedByCategory: Map<string, number>;
}) {
  const selected: Question[] = [];
  const shuffled = shuffleWithSeed(input.pool, input.random);

  for (const question of shuffled) {
    if (selected.length >= input.targetCount) {
      break;
    }

    if (input.selectedIds.has(question.id)) {
      continue;
    }

    const categoryCount = input.selectedByCategory.get(question.category) ?? 0;

    if (categoryCount >= MAX_CATEGORY_OCCURRENCES) {
      continue;
    }

    selected.push(question);
    input.selectedIds.add(question.id);
    input.selectedByCategory.set(question.category, categoryCount + 1);
  }

  return selected;
}

function fillRemainingQuestions(input: {
  allQuestions: Question[];
  random: SeededRandom;
  selectedIds: Set<string>;
  selectedByCategory: Map<string, number>;
  targetCount: number;
  avoidedIds: Set<string>;
}) {
  const remaining = input.allQuestions.filter((question) => !input.selectedIds.has(question.id));
  const preferred = shuffleWithSeed(
    remaining.filter((question) => !input.avoidedIds.has(question.id)),
    input.random
  );
  const avoided = shuffleWithSeed(
    remaining.filter((question) => input.avoidedIds.has(question.id)),
    input.random
  );
  const orderedRemaining = [...preferred, ...avoided];
  const fill: Question[] = [];

  for (const question of orderedRemaining) {
    if (fill.length >= input.targetCount) {
      break;
    }

    const categoryCount = input.selectedByCategory.get(question.category) ?? 0;

    if (categoryCount < MAX_CATEGORY_OCCURRENCES) {
      fill.push(question);
      input.selectedIds.add(question.id);
      input.selectedByCategory.set(question.category, categoryCount + 1);
    }
  }

  if (fill.length < input.targetCount) {
    for (const question of orderedRemaining) {
      if (fill.length >= input.targetCount) {
        break;
      }

      if (input.selectedIds.has(question.id)) {
        continue;
      }

      fill.push(question);
      input.selectedIds.add(question.id);
    }
  }

  return fill;
}

export function sampleRunQuestions(
  catalog: QuestionCatalog,
  runSeed: string,
  options?: { recentlyUsedQuestionIds?: string[] }
) {
  if (catalog.questions.length <= catalog.runQuestionCount) {
    return catalog.questions;
  }

  const random = createSeededRandom(`${catalog.questionSetVersion}:${runSeed}`);
  const selectedIds = new Set<string>();
  const selectedByCategory = new Map<string, number>();
  const avoidedIds = new Set(options?.recentlyUsedQuestionIds ?? []);
  const byBand = {
    easy: catalog.questions.filter((question) => question.difficultyBand === "easy"),
    medium: catalog.questions.filter((question) => question.difficultyBand === "medium"),
    hard: catalog.questions.filter((question) => question.difficultyBand === "hard")
  };

  const selected = [
    ...pickQuestionsByDifficultyBand({
      pool: byBand.easy,
      random,
      targetCount: TARGET_PER_DIFFICULTY_BAND,
      selectedIds,
      selectedByCategory
    }),
    ...pickQuestionsByDifficultyBand({
      pool: byBand.medium,
      random,
      targetCount: TARGET_PER_DIFFICULTY_BAND,
      selectedIds,
      selectedByCategory
    }),
    ...pickQuestionsByDifficultyBand({
      pool: byBand.hard,
      random,
      targetCount: TARGET_PER_DIFFICULTY_BAND,
      selectedIds,
      selectedByCategory
    })
  ];
  const remainingCount = catalog.runQuestionCount - selected.length;

  if (remainingCount > 0) {
    selected.push(
      ...fillRemainingQuestions({
        allQuestions: catalog.questions,
        random,
        selectedIds,
        selectedByCategory,
        targetCount: remainingCount,
        avoidedIds
      })
    );
  }

  return shuffleWithSeed(selected.slice(0, catalog.runQuestionCount), random);
}

export function createRunQuestionCatalog(input: {
  catalog: QuestionCatalog;
  runNumber: number;
  recentlyUsedQuestionIds?: string[];
}) {
  const avoidIds = new Set(input.recentlyUsedQuestionIds ?? []);
  const filteredCatalog =
    avoidIds.size === 0
      ? input.catalog
      : {
          ...input.catalog,
          questions: input.catalog.questions.filter((question) => !avoidIds.has(question.id))
        };
  const sourceCatalog =
    filteredCatalog.questions.length >= input.catalog.runQuestionCount ? filteredCatalog : input.catalog;
  const sampledQuestions = sampleRunQuestions(sourceCatalog, `${input.runNumber}`, {
    recentlyUsedQuestionIds: input.recentlyUsedQuestionIds
  });

  return {
    ...input.catalog,
    questions: sampledQuestions,
    runQuestionCount: Math.min(input.catalog.runQuestionCount, sampledQuestions.length)
  } satisfies QuestionCatalog;
}

export function createSupabaseQuestionCatalog(contentQuestions: ContentQuestion[]): QuestionCatalog | null {
  if (contentQuestions.length === 0) {
    return null;
  }

  const questions = contentQuestions.map(toGameQuestion);
  const questionSetVersion = contentQuestions[0]?.questionSetVersion ?? LIVE_QUESTION_SET_VERSION;

  if (!hasEnoughQuestions(questions)) {
    return null;
  }

  return {
    source: "supabase",
    questionSetVersion,
    questions,
    runQuestionCount: RUN_QUESTION_COUNT
  };
}

export function selectPlayableQuestionCatalog(contentQuestions: ContentQuestion[] | null | undefined) {
  return contentQuestions
    ? createSupabaseQuestionCatalog(contentQuestions) ?? createSeedQuestionCatalog()
    : createSeedQuestionCatalog();
}

export function getInitialQuestionId(catalog: QuestionCatalog) {
  const firstQuestionId = catalog.questions[0]?.id;

  if (!firstQuestionId) {
    throw new Error("Question catalog is empty.");
  }

  return firstQuestionId;
}

export function getQuestionForState(state: GameState, questionsById: Map<string, Question>) {
  const questionId = getCurrentQuestionId(state);
  const question = questionsById.get(questionId);

  if (!question) {
    throw new Error(`Question ${questionId} is not available in the active question catalog.`);
  }

  return question;
}

export function getFallbackNextQuestionId(questionOrder: string[], questions: Question[]) {
  const askedIds = new Set(questionOrder);
  return questions.find((question) => !askedIds.has(question.id))?.id ?? null;
}
