import type { CaseStudyDraftConfig } from './case-study-draft.config';
import { CaseStudyDraftProviderError } from './case-study-draft.provider';
import { OpenAiCaseStudyDraftProvider } from './openai-case-study-draft.provider';

const mockResponsesCreate = jest.fn();

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    responses: { create: mockResponsesCreate },
  })),
}));

const config: CaseStudyDraftConfig = {
  enabled: true,
  provider: 'openai',
  openaiApiKey: 'test-key',
  openaiModel: 'test-model',
  timeoutMs: 30_000,
  rateLimit: { max: 5, windowSeconds: 60 },
  usageLimit: { max: 25, windowSeconds: 86_400 },
  maxInputCharacters: 60_000,
  maxNotesLength: 2_000,
  maxOutputTokens: 1_200,
  errors: [],
};

const input = {
  project: {
    id: 'project-1',
    title: 'Antin OS',
    slug: 'antin-os',
    summary: 'Career operating system',
    description: null,
    techStack: ['NestJS'],
    repoUrl: null,
    liveUrl: null,
    isPublic: false,
  },
  notes: 'Owner notes',
  maxOutputTokens: 1_200,
  signal: new AbortController().signal,
};

const structuredDraft = {
  context: 'Context',
  problem: 'Problem',
  role: 'Developer',
  approach: 'Approach',
  responsibilities: ['Build'],
  technicalChallenges: ['Privacy'],
  outcomes: ['Result'],
  lessonsLearned: 'Lesson',
  needsConfirmation: ['Confirm result'],
};

describe('OpenAiCaseStudyDraftProvider', () => {
  beforeEach(() => {
    mockResponsesCreate.mockReset();
  });

  it('uses Responses API strict structured output without provider storage', async () => {
    mockResponsesCreate.mockResolvedValue({
      status: 'completed',
      output_text: JSON.stringify(structuredDraft),
      output: [],
    });

    const provider = new OpenAiCaseStudyDraftProvider(config);
    await expect(provider.generate(input)).resolves.toEqual(structuredDraft);

    expect(mockResponsesCreate).toHaveBeenCalledTimes(1);
    const calls = mockResponsesCreate.mock.calls as unknown as Array<
      [
        {
          model: string;
          input: string;
          max_output_tokens: number;
          store: boolean;
          text: {
            format: { type: string; name: string; strict: boolean };
          };
        },
        { signal: AbortSignal },
      ]
    >;
    const [providerRequest, providerOptions] = calls[0];
    expect(providerRequest.model).toBe('test-model');
    expect(providerRequest.input).toContain('Owner notes');
    expect(providerRequest.max_output_tokens).toBe(1_200);
    expect(providerRequest.store).toBe(false);
    expect(providerRequest.text.format.type).toBe('json_schema');
    expect(providerRequest.text.format.name).toBe('case_study_draft');
    expect(providerRequest.text.format.strict).toBe(true);
    expect(providerOptions.signal).toBe(input.signal);
  });

  it('maps aborts to timeout errors', async () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    mockResponsesCreate.mockRejectedValue(abortError);

    const provider = new OpenAiCaseStudyDraftProvider(config);
    await expect(provider.generate(input)).rejects.toMatchObject({
      code: 'timeout',
      message: 'AI provider timed out.',
    });
  });

  it('rejects incomplete and malformed responses', async () => {
    const provider = new OpenAiCaseStudyDraftProvider(config);
    mockResponsesCreate.mockResolvedValueOnce({
      status: 'incomplete',
      incomplete_details: { reason: 'max_output_tokens' },
      output_text: '',
      output: [],
    });

    await expect(provider.generate(input)).rejects.toMatchObject({
      code: 'malformed',
    });

    mockResponsesCreate.mockResolvedValueOnce({
      status: 'completed',
      output_text: '{not-json',
      output: [],
    });

    await expect(provider.generate(input)).rejects.toMatchObject({
      code: 'malformed',
    });
  });

  it('requires API-only provider credentials and model configuration', () => {
    expect(
      () =>
        new OpenAiCaseStudyDraftProvider({
          ...config,
          openaiApiKey: undefined,
        }),
    ).toThrow(CaseStudyDraftProviderError);
  });
});
