import assert from "node:assert/strict";
import test from "node:test";
import type { ContentQuestion } from "../domain/content.ts";
import { SEEDED_QUESTIONS } from "../seed/questions.ts";
import {
  createSeedQuestionCatalog,
  createSupabaseQuestionCatalog,
  getFallbackNextQuestionId,
  getInitialQuestionId,
  RUN_QUESTION_COUNT,
  selectPlayableQuestionCatalog
} from "./question-catalog.ts";

function createContentQuestion(index: number): ContentQuestion {
  return {
    id: `db-q-${index}`,
    externalKey: `launch-q-${String(index).padStart(3, "0")}`,
    prompt: `Prompt ${index}`,
    options: ["A", "B", "C", "D"],
    correctIndex: index % 4,
    category: index % 2 === 0 ? "Science" : "History",
    difficultyBand: index < 4 ? "easy" : index < 8 ? "medium" : "hard",
    pressureTag: index % 3 === 0 ? "spiky" : index % 3 === 1 ? "neutral" : "calm",
    questionSetVersion: "launch-v1",
    sourceLabel: "curated-launch"
  };
}

test("seed catalog stays the fallback baseline", () => {
  const catalog = createSeedQuestionCatalog();

  assert.equal(catalog.source, "seed");
  assert.equal(catalog.questions.length, SEEDED_QUESTIONS.length);
  assert.equal(catalog.runQuestionCount, RUN_QUESTION_COUNT);
  assert.equal(getInitialQuestionId(catalog), SEEDED_QUESTIONS[0]?.id);
});

test("supabase catalog is accepted only when it can sustain a full 12-question run", () => {
  const tooSmall = createSupabaseQuestionCatalog(Array.from({ length: 8 }, (_, index) => createContentQuestion(index)));
  const viable = createSupabaseQuestionCatalog(
    Array.from({ length: RUN_QUESTION_COUNT + 4 }, (_, index) => createContentQuestion(index))
  );

  assert.equal(tooSmall, null);
  assert.equal(viable?.source, "supabase");
  assert.equal(viable?.runQuestionCount, RUN_QUESTION_COUNT);
  assert.equal(viable?.questionSetVersion, "launch-v1");
});

test("playable catalog selection falls back to seed when live content is too thin", () => {
  const fallback = selectPlayableQuestionCatalog(
    Array.from({ length: 3 }, (_, index) => createContentQuestion(index))
  );
  const live = selectPlayableQuestionCatalog(
    Array.from({ length: RUN_QUESTION_COUNT }, (_, index) => createContentQuestion(index))
  );

  assert.equal(fallback.source, "seed");
  assert.equal(live.source, "supabase");
});

test("fallback next question skips previously asked ids deterministically", () => {
  const nextQuestionId = getFallbackNextQuestionId(
    [SEEDED_QUESTIONS[0]!.id, SEEDED_QUESTIONS[1]!.id],
    SEEDED_QUESTIONS
  );

  assert.equal(nextQuestionId, SEEDED_QUESTIONS[2]?.id);
});
