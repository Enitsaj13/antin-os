export function trimRequiredText({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value;
}

export function toNullableTrimmedText({ value }: { value: unknown }) {
  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function toOptionalTrimmedText({ value }: { value: unknown }) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
