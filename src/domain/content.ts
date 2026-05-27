import type { Database, Json } from "../lib/supabase/database.types.ts";
import type { DifficultyBand, PressureTag, Question } from "./game.ts";

export type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];
export type QuestionInsert = Database["public"]["Tables"]["questions"]["Insert"];

export type ContentQuestion = Question & {
  externalKey: string;
  questionSetVersion: string;
  sourceLabel: string;
};

export type QuestionImportRecord = {
  external_key: string;
  prompt: string;
  options: string[];
  correct_answer_index: number;
  category: string;
  difficulty_band: string;
  pressure_tag: string;
  is_active?: boolean;
  question_set_version: string;
  source_label: string;
};

const VALID_DIFFICULTY_BANDS: DifficultyBand[] = ["easy", "medium", "hard"];
const VALID_PRESSURE_TAGS: PressureTag[] = ["calm", "neutral", "spiky"];

function isQuestionOptionTuple(value: Json): value is [string, string, string, string] {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((option) => typeof option === "string" && option.trim().length > 0)
  );
}

function isDifficultyBand(value: string): value is DifficultyBand {
  return VALID_DIFFICULTY_BANDS.includes(value as DifficultyBand);
}

function isPressureTag(value: string): value is PressureTag {
  return VALID_PRESSURE_TAGS.includes(value as PressureTag);
}

function requireNonEmptyString(value: string, fieldName: string, recordKey: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Question ${recordKey} has an invalid ${fieldName}.`);
  }

  return value.trim();
}

function normalizeQuestionShape(input: {
  recordKey: string;
  prompt: string;
  options: Json;
  correctAnswerIndex: number;
  category: string;
  difficultyBand: string;
  pressureTag: string;
}) {
  const prompt = requireNonEmptyString(input.prompt, "prompt", input.recordKey);
  const category = requireNonEmptyString(input.category, "category", input.recordKey);

  if (!isQuestionOptionTuple(input.options)) {
    throw new Error(`Question ${input.recordKey} has an invalid options payload.`);
  }

  if (input.correctAnswerIndex < 0 || input.correctAnswerIndex > 3) {
    throw new Error(`Question ${input.recordKey} has an invalid correct answer index.`);
  }

  if (!isDifficultyBand(input.difficultyBand)) {
    throw new Error(`Question ${input.recordKey} has an unsupported difficulty band.`);
  }

  if (!isPressureTag(input.pressureTag)) {
    throw new Error(`Question ${input.recordKey} has an unsupported pressure tag.`);
  }

  return {
    prompt,
    category,
    options: input.options,
    correctAnswerIndex: input.correctAnswerIndex,
    difficultyBand: input.difficultyBand,
    pressureTag: input.pressureTag
  };
}

export function mapQuestionRow(row: QuestionRow): ContentQuestion {
  const normalized = normalizeQuestionShape({
    recordKey: row.id,
    prompt: row.prompt,
    options: row.options,
    correctAnswerIndex: row.correct_answer_index,
    category: row.category,
    difficultyBand: row.difficulty_band,
    pressureTag: row.pressure_tag
  });

  return {
    id: row.id,
    externalKey: row.external_key,
    prompt: normalized.prompt,
    options: normalized.options,
    correctIndex: normalized.correctAnswerIndex,
    category: normalized.category,
    difficultyBand: normalized.difficultyBand,
    pressureTag: normalized.pressureTag,
    questionSetVersion: row.question_set_version,
    sourceLabel: row.source_label
  };
}

export function mapActiveQuestionRows(rows: QuestionRow[]) {
  return rows.filter((row) => row.is_active).map(mapQuestionRow);
}

export function normalizeQuestionImportRecord(record: QuestionImportRecord): QuestionInsert {
  const externalKey = requireNonEmptyString(record.external_key, "external_key", record.external_key || "<unknown>");
  const questionSetVersion = requireNonEmptyString(
    record.question_set_version,
    "question_set_version",
    externalKey
  );
  const sourceLabel = requireNonEmptyString(record.source_label, "source_label", externalKey);
  const normalized = normalizeQuestionShape({
    recordKey: externalKey,
    prompt: record.prompt,
    options: record.options,
    correctAnswerIndex: record.correct_answer_index,
    category: record.category,
    difficultyBand: record.difficulty_band,
    pressureTag: record.pressure_tag
  });

  return {
    external_key: externalKey,
    prompt: normalized.prompt,
    options: normalized.options,
    correct_answer_index: normalized.correctAnswerIndex,
    category: normalized.category,
    difficulty_band: normalized.difficultyBand,
    pressure_tag: normalized.pressureTag,
    is_active: record.is_active ?? true,
    question_set_version: questionSetVersion,
    source_label: sourceLabel
  };
}

export function prepareQuestionImportRows(records: QuestionImportRecord[]) {
  const seenExternalKeys = new Set<string>();

  return records.map((record) => {
    const normalized = normalizeQuestionImportRecord(record);

    if (seenExternalKeys.has(normalized.external_key)) {
      throw new Error(`Duplicate external_key in import payload: ${normalized.external_key}`);
    }

    seenExternalKeys.add(normalized.external_key);
    return normalized;
  });
}

export function toGameQuestion(question: ContentQuestion): Question {
  return {
    id: question.id,
    category: question.category,
    prompt: question.prompt,
    options: question.options,
    correctIndex: question.correctIndex,
    difficultyBand: question.difficultyBand,
    pressureTag: question.pressureTag
  };
}
