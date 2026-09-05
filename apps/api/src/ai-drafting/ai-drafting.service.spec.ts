import type { AiDraftingConfig } from './ai-drafting.config';
import { AiDraftingError } from './ai-drafting.error';
import { AiDraftingLimiter } from './ai-drafting.limiter';
import { AiDraftingService } from './ai-drafting.service';
import type { StructuredAiProvider } from './structured-ai.provider';

function config(overrides: Partial<AiDraftingConfig> = {}): AiDraftingConfig {
  return {
    enabled: true,
    provider: 'mock',
    timeoutMs: 30_000,
    rateLimit: { max: 10, windowSeconds: 60 },
    usageLimit: { max: 10, windowSeconds: 60 },
    maxInputCharacters: 100,
    maxNotesLength: 2_000,
    maxOutputTokens: 1_200,
    errors: [],
    ...overrides,
  };
}

const request = {
  schemaName: 'test_schema',
  schemaDescription: 'Test output.',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['text'],
    properties: { text: { type: 'string' } },
  },
  instructions: 'Return test content.',
  input: { source: 'safe input' },
  normalize: (value: unknown) => value as { text: string },
  createMock: () => ({ text: 'mock text' }),
};

describe('AiDraftingService', () => {
  it('dispatches deterministic mock output without calling the provider', async () => {
    const generate = jest.fn();
    const provider: StructuredAiProvider = { generate };
    const service = new AiDraftingService(
      config(),
      new AiDraftingLimiter(),
      provider,
    );

    await expect(service.generate(request)).resolves.toEqual({
      text: 'mock text',
    });
    expect(generate).not.toHaveBeenCalled();
  });

  it('rejects disabled, invalid, and oversized requests before provider use', async () => {
    const generate = jest.fn();
    const provider: StructuredAiProvider = { generate };
    const disabled = new AiDraftingService(
      config({ enabled: false }),
      new AiDraftingLimiter(),
      provider,
    );
    await expect(disabled.generate(request)).rejects.toMatchObject({
      code: 'disabled',
    });

    const invalid = new AiDraftingService(
      config({ errors: ['invalid'] }),
      new AiDraftingLimiter(),
      provider,
    );
    await expect(invalid.generate(request)).rejects.toMatchObject({
      code: 'configuration',
    });

    const oversized = new AiDraftingService(
      config({ maxInputCharacters: 5 }),
      new AiDraftingLimiter(),
      provider,
    );
    await expect(oversized.generate(request)).rejects.toMatchObject({
      code: 'input-length',
    });
    expect(generate).not.toHaveBeenCalled();
  });

  it('shares one limiter budget across different structured operations', async () => {
    const provider: StructuredAiProvider = { generate: jest.fn() };
    const sharedLimiter = new AiDraftingLimiter();
    const service = new AiDraftingService(
      config({ rateLimit: { max: 1, windowSeconds: 60 } }),
      sharedLimiter,
      provider,
    );

    await service.generate(request);
    await expect(
      service.generate({ ...request, schemaName: 'another_domain' }),
    ).rejects.toMatchObject({ code: 'rate-limit' });
  });

  it('uses the structured provider with timeout signal in OpenAI mode', async () => {
    const generate = jest.fn().mockResolvedValue({ text: 'provider text' });
    const provider: StructuredAiProvider = {
      generate,
    };
    const service = new AiDraftingService(
      config({ provider: 'openai' }),
      new AiDraftingLimiter(),
      provider,
    );

    await expect(service.generate(request)).resolves.toEqual({
      text: 'provider text',
    });
    expect(generate).toHaveBeenCalledTimes(1);
    const calls = generate.mock.calls as unknown as Array<
      [
        {
          schemaName: string;
          serializedInput: string;
          maxOutputTokens: number;
          signal: AbortSignal;
        },
      ]
    >;
    const providerRequest = calls[0][0];
    expect(providerRequest.schemaName).toBe('test_schema');
    expect(providerRequest.serializedInput).toBe(JSON.stringify(request.input));
    expect(providerRequest.maxOutputTokens).toBe(1_200);
    expect(providerRequest.signal).toBeInstanceOf(AbortSignal);
  });

  it('preserves application-safe provider errors', async () => {
    const provider: StructuredAiProvider = {
      generate: jest
        .fn()
        .mockRejectedValue(new AiDraftingError('timeout', 'safe timeout')),
    };
    const service = new AiDraftingService(
      config({ provider: 'openai' }),
      new AiDraftingLimiter(),
      provider,
    );

    await expect(service.generate(request)).rejects.toMatchObject({
      code: 'timeout',
      message: 'safe timeout',
    });
  });
});
