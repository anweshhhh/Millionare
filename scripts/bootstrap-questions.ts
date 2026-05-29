import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types.ts";
import { prepareQuestionImportRows, type QuestionImportRecord } from "../src/domain/content.ts";
import { listActiveQuestionsWithClient } from "../src/lib/supabase/repositories.ts";

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

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
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

function requireEnv(env: EnvMap, key: string) {
  const value = env[key]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

async function main() {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const env = loadLocalEnv(repoRoot);
  const bankArg = process.argv[2];
  const bankPath = bankArg ? path.resolve(repoRoot, bankArg) : path.join(repoRoot, "content", "question-bank-v2.json");
  const supabaseUrl = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? "";
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!supabaseUrl) {
    throw new Error("Missing Supabase URL. Set SUPABASE_URL or VITE_SUPABASE_URL before bootstrapping questions.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY. Question bootstrap requires service-role access.");
  }

  if (!existsSync(bankPath)) {
    throw new Error(`Question bank file not found: ${bankPath}`);
  }

  const rawFile = readFileSync(bankPath, "utf8");
  const parsed = JSON.parse(rawFile) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("Question bank JSON must contain an array of records.");
  }

  const rows = prepareQuestionImportRows(parsed as QuestionImportRecord[]);
  const client = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const { error } = await client.from("questions").upsert(rows, {
    onConflict: "external_key"
  });

  if (error) {
    throw error;
  }

  const versions = [...new Set(rows.map((row) => row.question_set_version))];

  for (const version of versions) {
    const expectedActiveKeys = rows
      .filter((row) => row.question_set_version === version && row.is_active !== false)
      .map((row) => row.external_key);
    const loaded = await listActiveQuestionsWithClient(client, version);
    const loadedKeys = new Set(loaded.map((question) => question.externalKey));

    for (const externalKey of expectedActiveKeys) {
      if (!loadedKeys.has(externalKey)) {
        throw new Error(`Bootstrap verification failed. Active question ${externalKey} did not load through the repository.`);
      }
    }

    console.log(
      `Bootstrapped ${rows.filter((row) => row.question_set_version === version).length} question rows for ${version}; repository now loads ${loaded.length} active questions.`
    );
  }
}

await main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Question bootstrap failed: ${message}`);
  process.exitCode = 1;
});
