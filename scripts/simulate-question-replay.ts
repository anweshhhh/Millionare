import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { QuestionImportRecord } from "../src/domain/content.ts";
import { prepareQuestionImportRows, toGameQuestion } from "../src/domain/content.ts";
import {
  createRunQuestionCatalog,
  createSupabaseQuestionCatalog,
  RUN_QUESTION_COUNT
} from "../src/game/question-catalog.ts";

const DEFAULT_RUNS = 40;
const DEFAULT_WINDOW = 5;

type SimulationStats = {
  avgOverlapVsRecentRuns: number;
  maxOverlapVsRecentRuns: number;
  byDifficulty: Record<string, number>;
  byCategory: Record<string, number>;
};

function toCounter() {
  return {} as Record<string, number>;
}

function increment(counter: Record<string, number>, key: string) {
  counter[key] = (counter[key] ?? 0) + 1;
}

function formatCounter(counter: Record<string, number>) {
  return Object.entries(counter)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([key, value]) => `${key}:${value}`)
    .join(", ");
}

function simulateRuns(questionBank: QuestionImportRecord[], runCount: number, windowSize: number): SimulationStats {
  const prepared = prepareQuestionImportRows(questionBank);
  const catalog = createSupabaseQuestionCatalog(prepared.map((row, index) => toGameQuestion({
    id: `sim-${index}`,
    externalKey: row.external_key,
    prompt: row.prompt,
    options: row.options,
    correctIndex: row.correct_answer_index,
    category: row.category,
    difficultyBand: row.difficulty_band,
    pressureTag: row.pressure_tag,
    questionSetVersion: row.question_set_version,
    sourceLabel: row.source_label
  })));

  if (!catalog) {
    throw new Error(`Simulation requires at least ${RUN_QUESTION_COUNT} active rows.`);
  }

  const runHistory: string[][] = [];
  const overlaps: number[] = [];
  const byDifficulty = toCounter();
  const byCategory = toCounter();

  for (let runNumber = 1; runNumber <= runCount; runNumber += 1) {
    const recentRuns = runHistory.slice(-windowSize);
    const avoidIds = Array.from(new Set(recentRuns.flat()));
    const sampled = createRunQuestionCatalog({
      catalog,
      runNumber,
      recentlyUsedQuestionIds: avoidIds
    }).questions;

    const sampledIds = sampled.map((question) => question.id);
    runHistory.push(sampledIds);

    const overlap = sampledIds.filter((id) => avoidIds.includes(id)).length;
    overlaps.push(overlap);

    for (const question of sampled) {
      increment(byDifficulty, question.difficultyBand);
      increment(byCategory, question.category);
    }
  }

  const avgOverlap = overlaps.reduce((sum, value) => sum + value, 0) / overlaps.length;
  const maxOverlap = overlaps.reduce((max, value) => Math.max(max, value), 0);

  return {
    avgOverlapVsRecentRuns: Number(avgOverlap.toFixed(2)),
    maxOverlapVsRecentRuns: maxOverlap,
    byDifficulty,
    byCategory
  };
}

function main() {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const inputArg = process.argv[2];
  const runCountArg = process.argv[3];
  const windowArg = process.argv[4];
  const bankPath = inputArg
    ? path.resolve(repoRoot, inputArg)
    : path.join(repoRoot, "content", "question-bank-v1.json");
  const runCount = runCountArg ? Number(runCountArg) : DEFAULT_RUNS;
  const windowSize = windowArg ? Number(windowArg) : DEFAULT_WINDOW;

  const raw = JSON.parse(readFileSync(bankPath, "utf8")) as QuestionImportRecord[];
  const stats = simulateRuns(raw, runCount, windowSize);

  console.log(`Replay simulation: ${path.relative(repoRoot, bankPath)}`);
  console.log(`Runs: ${runCount}`);
  console.log(`Recent-run overlap window: ${windowSize}`);
  console.log(`Average overlap vs recent window: ${stats.avgOverlapVsRecentRuns}`);
  console.log(`Max overlap vs recent window: ${stats.maxOverlapVsRecentRuns}`);
  console.log(`Difficulty distribution: ${formatCounter(stats.byDifficulty)}`);
  console.log(`Category distribution: ${formatCounter(stats.byCategory)}`);
}

main();
