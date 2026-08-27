export class DatabaseUnavailableError extends Error {
  readonly code = "DB_UNAVAILABLE" as const;

  constructor(message = "The agarwood records are temporarily unavailable.", options?: { cause?: unknown }) {
    super(message, options);
    this.name = "DatabaseUnavailableError";
  }
}

export function toSafeDatabaseError(error: unknown): DatabaseUnavailableError {
  if (error instanceof DatabaseUnavailableError) return error;
  return new DatabaseUnavailableError("The agarwood records are temporarily unavailable.", { cause: error });
}
