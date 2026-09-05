import { getCaseStudyDraftConfig } from './case-study-draft.config';

const AI_ENV_KEYS = [
  'AI_DRAFTING_ENABLED',
  'AI_PROVIDER',
  'OPENAI_API_KEY',
  'OPENAI_MODEL',
  'AI_DRAFT_TIMEOUT_MS',
  'AI_DRAFT_RATE_LIMIT',
  'AI_DRAFT_USAGE_LIMIT',
  'AI_DRAFT_MAX_INPUT_CHARACTERS',
  'AI_DRAFT_MAX_NOTES_LENGTH',
  'AI_DRAFT_MAX_OUTPUT_TOKENS',
] as const;

describe('getCaseStudyDraftConfig', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    for (const key of AI_ENV_KEYS) {
      delete process.env[key];
    }
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses safe disabled defaults', () => {
    expect(getCaseStudyDraftConfig()).toEqual({
      enabled: false,
      provider: undefined,
      openaiApiKey: undefined,
      openaiModel: undefined,
      timeoutMs: 30_000,
      rateLimit: { max: 5, windowSeconds: 60 },
      usageLimit: { max: 25, windowSeconds: 86_400 },
      maxInputCharacters: 60_000,
      maxNotesLength: 2_000,
      maxOutputTokens: 1_200,
      errors: [],
    });
  });

  it('loads mock limits and windows', () => {
    process.env.AI_DRAFTING_ENABLED = 'true';
    process.env.AI_PROVIDER = 'mock';
    process.env.AI_DRAFT_TIMEOUT_MS = '45000';
    process.env.AI_DRAFT_RATE_LIMIT = '7/120';
    process.env.AI_DRAFT_USAGE_LIMIT = '30/86400';
    process.env.AI_DRAFT_MAX_INPUT_CHARACTERS = '70000';
    process.env.AI_DRAFT_MAX_NOTES_LENGTH = '3000';
    process.env.AI_DRAFT_MAX_OUTPUT_TOKENS = '1600';

    expect(getCaseStudyDraftConfig()).toMatchObject({
      enabled: true,
      provider: 'mock',
      timeoutMs: 45_000,
      rateLimit: { max: 7, windowSeconds: 120 },
      usageLimit: { max: 30, windowSeconds: 86_400 },
      maxInputCharacters: 70_000,
      maxNotesLength: 3_000,
      maxOutputTokens: 1_600,
      errors: [],
    });
  });

  it('reports incomplete OpenAI and invalid limit configuration', () => {
    process.env.AI_DRAFTING_ENABLED = 'true';
    process.env.AI_PROVIDER = 'openai';
    process.env.AI_DRAFT_TIMEOUT_MS = '0';
    process.env.AI_DRAFT_RATE_LIMIT = 'invalid';
    process.env.AI_DRAFT_MAX_INPUT_CHARACTERS = '-1';

    const config = getCaseStudyDraftConfig();

    expect(config.errors).toEqual(
      expect.arrayContaining([
        'OPENAI_API_KEY is required when AI_PROVIDER=openai',
        'OPENAI_MODEL is required when AI_PROVIDER=openai',
        'AI_DRAFT_TIMEOUT_MS must be a positive integer',
        'AI_DRAFT_RATE_LIMIT must use a positive integer or count/windowSeconds',
        'AI_DRAFT_MAX_INPUT_CHARACTERS must be a positive integer',
      ]),
    );
  });
});
