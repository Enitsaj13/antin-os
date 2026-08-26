const MAX_SAFE_ERROR_LENGTH = 300;

function firstMessage(value: unknown): string | null {
  if (typeof value === 'string') {
    const message = value.trim();
    const looksUnsafe =
      /<[^>]+>/.test(message) ||
      /^request failed with status \d+$/i.test(message) ||
      /^internal server error$/i.test(message);

    return message.length > 0 &&
      message.length <= MAX_SAFE_ERROR_LENGTH &&
      !looksUnsafe
      ? message
      : null;
  }

  if (Array.isArray(value)) {
    const messages = value
      .map(firstMessage)
      .filter((message): message is string => message !== null);
    return messages.length > 0 ? messages.join(' ') : null;
  }

  return null;
}

export function jobApplicationErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(error.message) as { message?: unknown };
    return firstMessage(parsed.message) ?? fallback;
  } catch {
    return firstMessage(error.message) ?? fallback;
  }
}
