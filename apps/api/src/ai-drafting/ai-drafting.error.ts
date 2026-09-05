export type AiDraftingErrorCode =
  | 'disabled'
  | 'configuration'
  | 'input-length'
  | 'rate-limit'
  | 'usage-limit'
  | 'timeout'
  | 'malformed'
  | 'provider';

export class AiDraftingError extends Error {
  constructor(
    public readonly code: AiDraftingErrorCode,
    message: string,
  ) {
    super(message);
  }
}
