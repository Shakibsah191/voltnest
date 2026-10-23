/**
 * An error we throw on purpose. The central error handler turns it into
 * a clean JSON response: { success: false, error: { code, message, details } }
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(statusCode: number, message: string, code = 'ERROR', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = 'Bad request', details?: unknown) {
    return new AppError(400, message, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'Please log in to continue') {
    return new AppError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'You do not have permission to do this') {
    return new AppError(403, message, 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found') {
    return new AppError(404, message, 'NOT_FOUND');
  }

  static conflict(message = 'Conflict') {
    return new AppError(409, message, 'CONFLICT');
  }
}
