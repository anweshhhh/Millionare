import assert from "node:assert/strict";
import test from "node:test";
import type { ContentQuestion } from "../domain/content.ts";
import { SEEDED_QUESTIONS } from "../seed/questions.ts";
import {
  createRunQuestionCatalog,
  createSeedQuestionCatalog,
  createSupabaseQuestionCatalog,
  getFallbackNextQuestionId,
  getInitialQuestionId,
  RUN_QUESTION_COUNT,
  sampleRunQuestions,
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

test("sampled run questions are unique and respect the run question count", () => {
  const catalog = createSupabaseQuestionCatalog(
    Array.from({ length: RUN_QUESTION_COUNT * 4 }, (_, index) => createContentQuestion(index))
  );

  assert.ok(catalog);

  const sampled = sampleRunQuestions(catalog, "run-1");
  const uniqueIds = new Set(sampled.map((question) => question.id));

  assert.equal(sampled.length, RUN_QUESTION_COUNT);
  assert.equal(uniqueIds.size, RUN_QUESTION_COUNT);
});

test("sampled runs keep a balanced difficulty baseline when enough questions exist", () => {
  const balancedDifficultyBand: Array<"easy" | "medium" | "hard"> = ["easy", "medium", "hard"];
  const catalog = createSupabaseQuestionCatalog(
    Array.from({ length: RUN_QUESTION_COUNT * 4 }, (_, index) => ({
      ...createContentQuestion(index),
      category: `Category ${index}`,
      difficultyBand: balancedDifficultyBand[index % balancedDifficultyBand.length]!
    }))
  );

  assert.ok(catalog);

  const sampled = sampleRunQuestions(catalog, "run-2");
  const counts = sampled.reduce(
    (accumulator, question) => {
      accumulator[question.difficultyBand] += 1;
      return accumulator;
    },
    { easy: 0, medium: 0, hard: 0 }
  );

  assert.ok(counts.easy >= 3);
  assert.ok(counts.medium >= 3);
  assert.ok(counts.hard >= 3);
});

test("createRunQuestionCatalog produces varied pools for different run seeds", () => {
  const catalog = createSupabaseQuestionCatalog(
    Array.from({ length: RUN_QUESTION_COUNT * 4 }, (_, index) => createContentQuestion(index))
  );

  assert.ok(catalog);

  const runOne = createRunQuestionCatalog({
    catalog,
    runNumber: 1
  });
  const runTwo = createRunQuestionCatalog({
    catalog,
    runNumber: 2
  });

  assert.equal(runOne.questions.length, RUN_QUESTION_COUNT);
  assert.equal(runTwo.questions.length, RUN_QUESTION_COUNT);
  assert.notDeepEqual(
    runOne.questions.map((question) => question.id),
    runTwo.questions.map((question) => question.id)
  );
});
