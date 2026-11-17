export type ErrorCode =
    | 'VALIDATION_ERROR'
    | 'UNAUTHORIZED'
    | 'NOT_FOUND'
    | 'INTERNAL';

const statusCodes: Record<ErrorCode, number> = {
    VALIDATION_ERROR: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL: 500,
};

export class AppError extends Error {
    readonly statusCode: number;

    constructor(
        readonly code: ErrorCode,
        message: string,
        readonly details?: unknown,
    ) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCodes[code];
    }
}

export const validationError = (message: string, details?: unknown) => new AppError('VALIDATION_ERROR', message, details);

export const unauthorizedError = (message = 'Missing or invalid credentials') => new AppError('UNAUTHORIZED', message);

export const notFoundError = (message: string) => new AppError('NOT_FOUND', message);

export const internalError = (message = 'Internal Server Error') => new AppError('INTERNAL', message);
