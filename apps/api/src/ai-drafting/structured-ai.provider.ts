export const STRUCTURED_AI_PROVIDER = Symbol('STRUCTURED_AI_PROVIDER');

export type StructuredAiProviderRequest = {
  schemaName: string;
  schemaDescription: string;
  schema: Record<string, unknown>;
  instructions: string;
  serializedInput: string;
  maxOutputTokens: number;
  signal?: AbortSignal;
};

export interface StructuredAiProvider {
  generate(request: StructuredAiProviderRequest): Promise<unknown>;
}
