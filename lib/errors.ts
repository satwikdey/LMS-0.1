/** Typed application errors. Route handlers translate these to JSON responses. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, "BAD_REQUEST", message, details);
export const unauthorized = (message = "Authentication required") =>
  new AppError(401, "UNAUTHENTICATED", message);
/** The caller's position(s) never allow this endpoint. */
export const forbiddenRole = (message = "Your role does not permit this action") =>
  new AppError(403, "FORBIDDEN_ROLE", message);
/** The caller holds the position but not for this class/section/offering. */
export const forbiddenScope = (message = "This is outside your assigned scope") =>
  new AppError(403, "FORBIDDEN_SCOPE", message);
export const notFound = (what = "Record") => new AppError(404, "NOT_FOUND", `${what} not found`);
export const conflict = (message: string, details?: unknown) =>
  new AppError(409, "CONFLICT", message, details);
export const unprocessable = (message: string, details?: unknown) =>
  new AppError(422, "UNPROCESSABLE", message, details);
export const tooMany = (message = "Too many attempts. Please try again later.") =>
  new AppError(429, "RATE_LIMITED", message);
