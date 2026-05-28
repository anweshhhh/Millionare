import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { buildAdminIntelligenceReport } from "../src/domain/admin-intelligence.ts";
import { formatAdminIntelligenceReport } from "../src/domain/admin-report.ts";
import type { Database } from "../src/lib/supabase/database.types.ts";
import {
  fetchAllPlayerModelsWithClient,
  fetchAllQuestionSignalsWithClient,
  fetchAllRunsWithClient,
  listActiveQuestionsWithClient
} from "../src/lib/supabase/repositories.ts";

type EnvMap = Record<string, string>;

function parseEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return {};
  }

  const env: EnvMap = {};
  const file = readFileSync(filePath, "utf8");

  for (const line of file.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function loadLocalEnv(repoRoot: string) {
  return {
    ...parseEnvFile(path.join(repoRoot, ".env")),
    ...parseEnvFile(path.join(repoRoot, ".env.local")),
    ...Object.fromEntries(
      Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === "string")
    )
  };
}

function parseArgs(argv: string[]) {
  let questionSetVersion = "launch-v1";
  let json = false;

  for (const arg of argv) {
    if (arg === "--json") {
      json = true;
      continue;
    }

    if (arg.startsWith("--question-set-version=")) {
      questionSetVersion = arg.slice("--question-set-version=".length).trim() || questionSetVersion;
    }
  }

  return { questionSetVersion, json };
}

async function main() {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const env = loadLocalEnv(repoRoot);
  const args = parseArgs(process.argv.slice(2));
  const supabaseUrl = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? "";
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!supabaseUrl) {
    throw new Error("Missing Supabase URL. Set SUPABASE_URL or VITE_SUPABASE_URL before generating the admin report.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY. Admin report generation requires service-role access.");
  }

  const client = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const [questions, runs, allSignals, playerModels] = await Promise.all([
    listActiveQuestionsWithClient(client, args.questionSetVersion),
    fetchAllRunsWithClient(client, { questionSetVersion: args.questionSetVersion }),
    fetchAllQuestionSignalsWithClient(client),
    fetchAllPlayerModelsWithClient(client)
  ]);

  const runIds = new Set(runs.map((run) => run.id));
  const questionSignals = allSignals.filter((signal) => runIds.has(signal.runId));
  const playerModelUserIds = new Set(runs.map((run) => run.userId));
  const relevantPlayerModels = playerModels.filter((model) => playerModelUserIds.has(model.userId));
  const report = buildAdminIntelligenceReport({
    runs,
    questionSignals,
    questions,
    playerModels: relevantPlayerModels
  });

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(formatAdminIntelligenceReport(report));
}

await main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Admin report generation failed: ${message}`);
  process.exitCode = 1;
});
