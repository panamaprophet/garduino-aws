import { APIGatewayProxyEventV2WithLambdaAuthorizer, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { AppError, internalError, unauthorizedError, validationError } from '@/shared/errors';

export interface RequestContext {
    userId: string;
}

export type HttpEvent = APIGatewayProxyEventV2WithLambdaAuthorizer<Partial<RequestContext>>;

type HttpResult = APIGatewayProxyStructuredResultV2;

type HandlerFn<T> = (event: HttpEvent, context: RequestContext) => Promise<T> | T;

interface ResponseOptions {
    statusCode?: number;
    meta?: Record<string, unknown>;
}

class HttpResponse<T> {
    constructor(readonly data: T, readonly options: ResponseOptions) {}
}

const json = (statusCode: number, body: unknown): HttpResult => ({
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
});

export const respond = <T>(data: T, options: ResponseOptions) => new HttpResponse(data, options);

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

const getUserId = (event: HttpEvent) => {
    const userId = event.requestContext.authorizer?.lambda?.userId;

    if (!userId) {
        throw unauthorizedError();
    }

    return userId;
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
        const result = await handler(event, { userId });

        const response = result instanceof HttpResponse ? result : new HttpResponse(result, {});
        const { data, options } = response;

        return json(options.statusCode ?? 200, {
            data,
            meta: { ...options.meta, requestId: event.requestContext.requestId },
        });
    } catch (error) {
        const [statusCode, details] = toErrorResult(error);

        return json(statusCode, { error: details });
    }
};
