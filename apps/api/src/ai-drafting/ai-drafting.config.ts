export type AiDraftingProviderName = 'mock' | 'openai';

export type WindowLimit = {
  max: number;
  windowSeconds: number;
};

export type AiDraftingConfig = {
  enabled: boolean;
  provider?: AiDraftingProviderName;
  openaiApiKey?: string;
  openaiModel?: string;
  timeoutMs: number;
  rateLimit: WindowLimit;
  usageLimit: WindowLimit;
  maxInputCharacters: number;
  maxNotesLength: number;
  maxOutputTokens: number;
  errors: string[];
};

export const AI_DRAFTING_CONFIG = Symbol('AI_DRAFTING_CONFIG');

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function booleanEnv(name: string, fallback: boolean): boolean {
  const value = optionalEnv(name);

  if (!value) {
    return fallback;
  }

  return value === '1' || value.toLowerCase() === 'true';
}

function positiveIntegerEnv(
  name: string,
  fallback: number,
  errors: string[],
): number {
  const raw = optionalEnv(name);

  if (!raw) {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isInteger(value) || value <= 0) {
    errors.push(`${name} must be a positive integer`);
    return fallback;
  }

  return value;
}

function windowLimitEnv(
  name: string,
  fallback: WindowLimit,
  errors: string[],
): WindowLimit {
  const raw = optionalEnv(name);

  if (!raw) {
    return fallback;
  }

  const [maxRaw, windowRaw] = raw.split('/');
  const max = Number(maxRaw);
  const windowSeconds = Number(windowRaw ?? fallback.windowSeconds);

  if (
    !Number.isInteger(max) ||
    max <= 0 ||
    !Number.isInteger(windowSeconds) ||
    windowSeconds <= 0
  ) {
    errors.push(`${name} must use a positive integer or count/windowSeconds`);
    return fallback;
  }

  return { max, windowSeconds };
}

function providerEnv(
  name: string,
  errors: string[],
): AiDraftingProviderName | undefined {
  const value = optionalEnv(name);

  if (!value) {
    return undefined;
  }

  if (value === 'mock' || value === 'openai') {
    return value;
  }

  errors.push(`${name} must be mock or openai`);
  return undefined;
}

export function getAiDraftingConfig(): AiDraftingConfig {
  const errors: string[] = [];
  const enabled = booleanEnv('AI_DRAFTING_ENABLED', false);
  const provider = providerEnv('AI_PROVIDER', errors);
  const openaiApiKey = optionalEnv('OPENAI_API_KEY');
  const openaiModel = optionalEnv('OPENAI_MODEL');

  if (enabled && !provider) {
    errors.push('AI_PROVIDER is required when AI drafting is enabled');
  }

  if (enabled && provider === 'openai') {
    if (!openaiApiKey) {
      errors.push('OPENAI_API_KEY is required when AI_PROVIDER=openai');
    }

    if (!openaiModel) {
      errors.push('OPENAI_MODEL is required when AI_PROVIDER=openai');
    }
  }

  return {
    enabled,
    provider,
    openaiApiKey,
    openaiModel,
    timeoutMs: positiveIntegerEnv('AI_DRAFT_TIMEOUT_MS', 30_000, errors),
    rateLimit: windowLimitEnv(
      'AI_DRAFT_RATE_LIMIT',
      { max: 5, windowSeconds: 60 },
      errors,
    ),
    usageLimit: windowLimitEnv(
      'AI_DRAFT_USAGE_LIMIT',
      { max: 25, windowSeconds: 86_400 },
      errors,
    ),
    maxInputCharacters: positiveIntegerEnv(
      'AI_DRAFT_MAX_INPUT_CHARACTERS',
      60_000,
      errors,
    ),
    maxNotesLength: positiveIntegerEnv(
      'AI_DRAFT_MAX_NOTES_LENGTH',
      2_000,
      errors,
    ),
    maxOutputTokens: positiveIntegerEnv(
      'AI_DRAFT_MAX_OUTPUT_TOKENS',
      1_200,
      errors,
    ),
    errors,
  };
}
