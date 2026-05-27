import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import type { QuestionImportRecord, QuestionRow } from "./content.ts";
import {
  mapActiveQuestionRows,
  mapQuestionRow,
  normalizeQuestionImportRecord,
  prepareQuestionImportRows,
  toGameQuestion
} from "./content.ts";
import { RUN_QUESTION_COUNT } from "../game/question-catalog.ts";

function createQuestionRow(overrides: Partial<QuestionRow> = {}): QuestionRow {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    external_key: "seed-q-01",
    prompt: "Which planet is known for its rings?",
    options: ["Mars", "Saturn", "Venus", "Mercury"],
    correct_answer_index: 1,
    category: "Science",
    difficulty_band: "easy",
    pressure_tag: "calm",
    is_active: true,
    question_set_version: "seed-v1",
    source_label: "manual",
    created_at: "2026-05-03T00:00:00.000Z",
    updated_at: "2026-05-03T00:00:00.000Z",
    ...overrides
  };
}

function createImportRecord(overrides: Partial<QuestionImportRecord> = {}): QuestionImportRecord {
  return {
    external_key: "launch-q-01",
    prompt: "Which planet is known for its rings?",
    options: ["Mars", "Saturn", "Venus", "Mercury"],
    correct_answer_index: 1,
    category: "Science",
    difficulty_band: "easy",
    pressure_tag: "calm",
    is_active: true,
    question_set_version: "launch-v1",
    source_label: "curated-launch",
    ...overrides
  };
}

test("valid question rows map into canonical content questions", () => {
  const mapped = mapQuestionRow(createQuestionRow());

  assert.deepEqual(mapped, {
    id: "11111111-1111-1111-1111-111111111111",
    externalKey: "seed-q-01",
    prompt: "Which planet is known for its rings?",
    options: ["Mars", "Saturn", "Venus", "Mercury"],
    correctIndex: 1,
    category: "Science",
    difficultyBand: "easy",
    pressureTag: "calm",
    questionSetVersion: "seed-v1",
    sourceLabel: "manual"
  });

  assert.deepEqual(toGameQuestion(mapped), {
    id: "11111111-1111-1111-1111-111111111111",
    category: "Science",
    prompt: "Which planet is known for its rings?",
    options: ["Mars", "Saturn", "Venus", "Mercury"],
    correctIndex: 1,
    difficultyBand: "easy",
    pressureTag: "calm"
  });
});

test("invalid option counts are rejected", () => {
  assert.throws(
    () =>
      mapQuestionRow(
        createQuestionRow({
          options: ["Mars", "Saturn", "Venus"]
        })
      ),
    /invalid options payload/
  );
});

test("invalid answer indexes are rejected", () => {
  assert.throws(
    () =>
      mapQuestionRow(
        createQuestionRow({
          correct_answer_index: 4
        })
      ),
    /invalid correct answer index/
  );
});

test("invalid difficulty and pressure metadata are rejected", () => {
  assert.throws(
    () =>
      mapQuestionRow(
        createQuestionRow({
          difficulty_band: "extreme" as QuestionRow["difficulty_band"]
        })
      ),
    /unsupported difficulty band/
  );

  assert.throws(
    () =>
      mapQuestionRow(
        createQuestionRow({
          pressure_tag: "volatile" as QuestionRow["pressure_tag"]
        })
      ),
    /unsupported pressure tag/
  );
});

test("inactive rows are excluded from active question mapping", () => {
  const mapped = mapActiveQuestionRows([
    createQuestionRow(),
    createQuestionRow({
      id: "22222222-2222-2222-2222-222222222222",
      external_key: "seed-q-02",
      is_active: false
    })
  ]);

  assert.equal(mapped.length, 1);
  assert.equal(mapped[0]?.externalKey, "seed-q-01");
});

test("valid import records normalize into question insert rows", () => {
  const insert = normalizeQuestionImportRecord(createImportRecord());

  assert.deepEqual(insert, {
    external_key: "launch-q-01",
    prompt: "Which planet is known for its rings?",
    options: ["Mars", "Saturn", "Venus", "Mercury"],
    correct_answer_index: 1,
    category: "Science",
    difficulty_band: "easy",
    pressure_tag: "calm",
    is_active: true,
    question_set_version: "launch-v1",
    source_label: "curated-launch"
  });
});

test("malformed import records fail clearly", () => {
  assert.throws(
    () =>
      normalizeQuestionImportRecord(
        createImportRecord({
          external_key: "   "
        })
      ),
    /invalid external_key/
  );

  assert.throws(
    () =>
      normalizeQuestionImportRecord(
        createImportRecord({
          category: ""
        })
      ),
    /invalid category/
  );
});

test("duplicate external keys are rejected during import preparation", () => {
  assert.throws(
    () =>
      prepareQuestionImportRows([
        createImportRecord(),
        createImportRecord({
          prompt: "A different prompt with the same key."
        })
      ]),
    /Duplicate external_key/
  );
});

test("checked-in question bank JSON normalizes cleanly", () => {
  const filePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../content/question-bank-v1.json");
  const parsed = JSON.parse(readFileSync(filePath, "utf8")) as QuestionImportRecord[];
  const prepared = prepareQuestionImportRows(parsed);

  assert.equal(prepared.length, 24);
  assert.equal(prepared[0]?.question_set_version, "launch-v1");
  assert.ok(prepared.every((row) => row.is_active !== false));
});

test("checked-in question bank preserves full-run and metadata coverage", () => {
  const filePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../content/question-bank-v1.json");
  const parsed = JSON.parse(readFileSync(filePath, "utf8")) as QuestionImportRecord[];
  const prepared = prepareQuestionImportRows(parsed);

  const difficultyBands = new Set(prepared.map((row) => row.difficulty_band));
  const pressureTags = new Set(prepared.map((row) => row.pressure_tag));
  const activeRows = prepared.filter((row) => row.is_active !== false);

  assert.ok(activeRows.length >= RUN_QUESTION_COUNT);
  assert.deepEqual([...difficultyBands].sort(), ["easy", "hard", "medium"]);
  assert.deepEqual([...pressureTags].sort(), ["calm", "neutral", "spiky"]);
});
