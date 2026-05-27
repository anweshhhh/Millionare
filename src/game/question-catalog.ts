import { toGameQuestion, type ContentQuestion } from "../domain/content.ts";
import type { Question } from "../domain/game.ts";
import { PROGRESSION_LADDER } from "../domain/progression.ts";
import { QUESTION_SET_VERSION, SEEDED_QUESTIONS } from "../seed/questions.ts";
import { getCurrentQuestionId } from "./game-state.ts";
import type { GameState } from "../domain/game.ts";

export const RUN_QUESTION_COUNT = PROGRESSION_LADDER.length;
export const LIVE_QUESTION_SET_VERSION = "launch-v1";

export type QuestionCatalogSource = "seed" | "supabase";

export type QuestionCatalog = {
  source: QuestionCatalogSource;
  questionSetVersion: string;
  questions: Question[];
  runQuestionCount: number;
};

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
