import type { LadderStep } from "./game.ts";

export const BASELINE_STEP = {
  code: "N00",
  label: "Threshold"
} as const;

export const PROGRESSION_LADDER: LadderStep[] = [
  { rank: 1, code: "N01", label: "Signal", pulse: "Initial read" },
  { rank: 2, code: "N02", label: "Tell", pulse: "First crack" },
  { rank: 3, code: "N03", label: "Thread", pulse: "Pattern trace" },
  { rank: 4, code: "N04", label: "Pattern", pulse: "Stable read" },
  { rank: 5, code: "N05", label: "Pulse", pulse: "Tempo held" },
  { rank: 6, code: "N06", label: "Drift", pulse: "Pressure climbs" },
  { rank: 7, code: "N07", label: "Cipher", pulse: "Mind split" },
  { rank: 8, code: "N08", label: "Fracture", pulse: "Resolve tested" },
  { rank: 9, code: "N09", label: "Mirage", pulse: "Confidence warps" },
  { rank: 10, code: "N10", label: "Ghost", pulse: "Instinct duel" },
  { rank: 11, code: "N11", label: "Oracle", pulse: "Reading complete" },
  { rank: 12, code: "N12", label: "Crown", pulse: "Mind reader mode" }
];

export function getStepByRank(rank: number) {
  return PROGRESSION_LADDER.find((step) => step.rank === rank) ?? null;
}
