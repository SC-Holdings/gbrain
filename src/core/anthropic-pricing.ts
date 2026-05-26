/**
 * v0.28: Anthropic model pricing constants for the dream-cycle budget meter.
 *
 * Prices in USD per 1M tokens (input | output). Numbers reflect Anthropic's
 * published pricing as of 2026-05-01. Update when Anthropic publishes new
 * pricing — the JSON in `~/.gbrain/audit/dream-budget-*.jsonl` carries the
 * snapshot per call so historical estimates stay reproducible.
 *
 * Codex P1 #10 fold: non-Anthropic models (gemini, gpt, anything not in
 * this map) bypass the budget gate with a `BUDGET_METER_NO_PRICING` warn
 * once per process. The cycle still runs unbounded for those models.
 * Future: per-provider pricing modules.
 */

export interface ModelPricing {
  /** USD per 1M input tokens. */
  input: number;
  /** USD per 1M output tokens. */
  output: number;
}

/** Map of Anthropic model id → pricing. Aliases (opus/sonnet/haiku) resolve via DEFAULT_ALIASES. */
export const ANTHROPIC_PRICING: Record<string, ModelPricing> = {
  // Claude 4.7 generation (current)
  // Opus 4.7 dropped from $15/$75 (Opus 4) to $5/$25 per
  // https://platform.claude.com/docs/en/about-claude/models/overview (verified 2026-05-10).
  'claude-opus-4-7':            { input:  5.00, output: 25.00 },
  'claude-sonnet-4-6':          { input:  3.00, output: 15.00 },
  'claude-haiku-4-5-20251001':  { input:  1.00, output:  5.00 },
  // Older but still frequently aliased
  'claude-opus-4-6':            { input:  5.00, output: 25.00 },
  'claude-3-5-sonnet-20241022': { input:  3.00, output: 15.00 },
  'claude-3-5-haiku-20241022':  { input:  0.80, output:  4.00 },
  // Free OpenRouter models (genuinely $0) — without an entry the budget
  // tracker hard-fails any capped call (brainstorm/lsd force a $5 cap), so
  // these are required to run brainstorm/lsd on the brain's free models.
  // Keyed in both the bare (dream config) and provider-prefixed (gateway
  // model-string) forms so direct lookup hits before the lossy `:` tail split.
  'openai/gpt-oss-120b:free':                          { input: 0, output: 0 },
  'openai:openai/gpt-oss-120b:free':                   { input: 0, output: 0 },
  'openrouter:openai/gpt-oss-120b:free':               { input: 0, output: 0 },
  'nvidia/nemotron-3-super-120b-a12b:free':            { input: 0, output: 0 },
  'openai:nvidia/nemotron-3-super-120b-a12b:free':     { input: 0, output: 0 },
  'openrouter:nvidia/nemotron-3-super-120b-a12b:free': { input: 0, output: 0 },
  // Paid gpt-oss-120b (OpenRouter) — the radar's JUDGE model (NOT :free, so the
  // :free->$0 rule doesn't apply). USD per 1M tokens, verified 2026-05-25.
  'openai/gpt-oss-120b':             { input: 0.039, output: 0.18 },
  'openrouter:openai/gpt-oss-120b':  { input: 0.039, output: 0.18 },
};

/**
 * Estimate the upper-bound USD cost of a single submit.
 * Uses (estimatedInputTokens × inputRate) + (maxOutputTokens × outputRate).
 * The maxOutputTokens upper-bounds the output cost — actual completions
 * usually return less.
 *
 * Returns null when the model isn't in the pricing map. Callers warn-once
 * and treat as zero-cost (the cycle runs unbounded for that submit).
 */
export function estimateMaxCostUsd(
  modelId: string,
  estimatedInputTokens: number,
  maxOutputTokens: number,
): number | null {
  // Accept both bare (`claude-opus-4-7`) and provider-prefixed
  // (`anthropic:claude-opus-4-7`) ids. Required since cebu-v4's
  // model-config rewrite (commit c4f03a9d) prefixes every default — without
  // tail fallback, every internal call would hit BUDGET_METER_NO_PRICING and
  // silently disable the budget gate.
  let p = ANTHROPIC_PRICING[modelId];
  if (!p && modelId.includes(':')) {
    const tail = modelId.split(':', 2)[1];
    if (tail) p = ANTHROPIC_PRICING[tail];
  }
  if (!p) return null;
  return (
    (estimatedInputTokens / 1_000_000) * p.input +
    (maxOutputTokens     / 1_000_000) * p.output
  );
}
