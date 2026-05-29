import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { QuestionImportRecord } from "../src/domain/content.ts";
import { prepareQuestionImportRows } from "../src/domain/content.ts";

type Counter = Record<string, number>;

function toCounter(values: string[]) {
  return values.reduce<Counter>((accumulator, value) => {
    accumulator[value] = (accumulator[value] ?? 0) + 1;
    return accumulator;
  }, {});
}

function formatCounter(counter: Counter) {
  return Object.entries(counter)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([key, value]) => `${key}:${value}`)
    .join(", ");
}

function normalizePrompt(prompt: string) {
  return prompt.trim().toLowerCase().replace(/\s+/g, " ");
}

function loadBank(filePath: string) {
  if (!existsSync(filePath)) {
    throw new Error(`Question bank file not found: ${filePath}`);
  }

  const parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Question bank JSON must contain an array.");
  }

  return parsed as QuestionImportRecord[];
}

function collectWarnings(rows: ReturnType<typeof prepareQuestionImportRows>) {
  const warnings: string[] = [];
  const categories = new Set(rows.map((row) => row.category));
  const promptsByNormalized = new Map<string, string[]>();
  const answerIndexCounts = toCounter(rows.map((row) => String(row.correct_answer_index)));

  for (const row of rows) {
    const normalizedPrompt = normalizePrompt(row.prompt);
    const existing = promptsByNormalized.get(normalizedPrompt) ?? [];
    existing.push(row.external_key);
    promptsByNormalized.set(normalizedPrompt, existing);

    if (row.prompt.length > 120) {
      warnings.push(`Long prompt (${row.prompt.length} chars): ${row.external_key}`);
    }

    const longestOption = row.options.reduce((longest, option) => Math.max(longest, option.length), 0);
    if (longestOption > 48) {
      warnings.push(`Long option (${longestOption} chars): ${row.external_key}`);
    }
  }

  for (const [normalizedPrompt, keys] of promptsByNormalized.entries()) {
    if (keys.length > 1) {
      warnings.push(`Duplicate prompt across keys (${keys.join(", ")}): "${normalizedPrompt.slice(0, 72)}..."`);
    }
  }

  if (categories.size < 10) {
    warnings.push(`Low category coverage: found ${categories.size}, expected at least 10 for broad replay.`);
  }

  const easiest = Math.min(...Object.values(answerIndexCounts).filter(Boolean));
  const hardest = Math.max(...Object.values(answerIndexCounts).filter(Boolean));
  if (hardest - easiest > Math.ceil(rows.length * 0.18)) {
    warnings.push("Correct answer index distribution looks skewed; review option ordering bias.");
  }

  return warnings;
}

function main() {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const inputArg = process.argv[2];
  const bankPath = inputArg
    ? path.resolve(repoRoot, inputArg)
    : path.join(repoRoot, "content", "question-bank-v2.json");

  const raw = loadBank(bankPath);
  const rows = prepareQuestionImportRows(raw);
  const activeRows = rows.filter((row) => row.is_active !== false);
  const byCategory = toCounter(activeRows.map((row) => row.category));
  const byDifficulty = toCounter(activeRows.map((row) => row.difficulty_band));
  const byPressure = toCounter(activeRows.map((row) => row.pressure_tag));
  const byVersion = toCounter(activeRows.map((row) => row.question_set_version));
  const warnings = collectWarnings(activeRows);

  console.log(`Question bank audit: ${path.relative(repoRoot, bankPath)}`);
  console.log(`Total rows: ${rows.length}`);
  console.log(`Active rows: ${activeRows.length}`);
  console.log(`Question set versions: ${formatCounter(byVersion)}`);
  console.log(`Category distribution: ${formatCounter(byCategory)}`);
  console.log(`Difficulty distribution: ${formatCounter(byDifficulty)}`);
  console.log(`Pressure distribution: ${formatCounter(byPressure)}`);

  if (warnings.length === 0) {
    console.log("Warnings: none");
    return;
  }

  console.log("Warnings:");
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}

main();
