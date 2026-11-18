import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { AppError, internalError, unauthorizedError, validationError } from '@/lib/errors';

export type HttpEvent = APIGatewayProxyEventV2WithJWTAuthorizer;

export type HttpResult = APIGatewayProxyStructuredResultV2;

export interface RequestContext {
    userId: string;
}

type HandlerFn<T> = (event: HttpEvent, context: RequestContext) => Promise<T> | T;

const json = (statusCode: number, body: unknown): HttpResult => ({
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
});

const toErrorResult = (error: unknown): [
    statusCode: number,
    details: Pick<AppError, 'code' | 'message' | 'details'>
] => {
    const appError = error instanceof AppError ? error : internalError();

    if (!(error instanceof AppError) || appError.statusCode >= 500) {
        console.error('request failed:', error);
    }

    const { code, statusCode, message, details } = appError;

    const result = {
        code,
        message,
        ...(details ? { details } : {}),
    };

    return [statusCode, result];
};

export const getUserId = (event: HttpEvent) => {
    const sub = event.requestContext.authorizer?.jwt?.claims?.sub;

    if (typeof sub !== 'string' || sub.length === 0) {
        throw unauthorizedError();
    }

    return sub;
};

export const getPathParameter = (event: HttpEvent, name: string) => {
    const value = event.pathParameters?.[name];

    if (!value) {
        throw validationError(`Path parameter "${name}" is required`);
    }

    return value;
};

export const getJsonBody = (event: HttpEvent): unknown => {
    if (!event.body) {
        throw validationError('Request body is required');
    }

    const raw = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString('utf8')
        : event.body;

    try {
        return JSON.parse(raw);
    } catch {
        throw validationError('Request body must be valid JSON');
    }
};

export const defineHandler = <T>(handler: HandlerFn<T>) => async (event: HttpEvent): Promise<HttpResult> => {
    try {
        const userId = getUserId(event);
        const data = await handler(event, { userId });

        return json(200, {
            data,
            meta: { requestId: event.requestContext.requestId },
        });
    } catch (error) {
        const [statusCode, details] = toErrorResult(error);

        return json(statusCode, { error: details });
    }
};
