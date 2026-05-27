import type { GameState, Question } from "../domain/game.ts";
import type { PlayerModelSnapshot } from "../domain/player-model.ts";
import { chooseAdaptiveQuestion } from "../domain/adaptive-engine.ts";

function toRecentCategories(questionOrder: string[], questionsById: Map<string, Question>) {
  return questionOrder
    .slice(-3)
    .map((questionId) => questionsById.get(questionId)?.category ?? null)
    .filter((category): category is string => category !== null);
}

export function selectNextAdaptiveQuestionId(input: {
  state: GameState;
  playerModel: PlayerModelSnapshot | null;
  questions: Question[];
}) {
  const { state, playerModel, questions } = input;

  const questionsById = new Map(questions.map((question) => [question.id, question]));
  const askedQuestionIds = new Set(state.questionOrder);
  const candidates = questions.filter((question) => !askedQuestionIds.has(question.id));

  if (candidates.length === 0) {
    return null;
  }

  const recentResults = state.answerLog.slice(-3).map((record) => record.result);
  const recentCategories = toRecentCategories(state.questionOrder, questionsById);
  const currentRank = Math.min(state.questionIndex + 2, questions.length);

  return chooseAdaptiveQuestion({
    playerModel,
    runContext: {
      currentRank,
      recentResults,
      recentCategories,
      recentlySeenQuestionIds: state.questionOrder.slice(-4)
    },
    candidates
  }).chosenQuestionId;
}
