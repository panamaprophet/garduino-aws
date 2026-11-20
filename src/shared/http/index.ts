import { APIGatewayProxyEventV2WithLambdaAuthorizer, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { z } from 'zod';

export interface RequestContext {
    userId: string;
}

interface RequestSchema {
    params?: z.ZodType;
    query?: z.ZodType;
    body?: z.ZodType;
}

type Output<T> = T extends z.ZodType ? z.output<T> : undefined;

interface Request<S extends RequestSchema> {
    userId: string;
    params: Output<S['params']>;
    query: Output<S['query']>;
    body: Output<S['body']>;
}

interface Response<T> {
    data: T;
    meta?: Record<string, unknown>;
    status?: number;
}

type HttpEvent = APIGatewayProxyEventV2WithLambdaAuthorizer<Partial<RequestContext>>;

type HttpResult = APIGatewayProxyStructuredResultV2;

export class HttpError extends Error {
    constructor(readonly status: number, readonly code: string, message: string, readonly details?: unknown) {
        super(message);
    }
}

export const badRequest = (message: string, details?: unknown): never => {
    throw new HttpError(400, 'VALIDATION_ERROR', message, details);
};

export const notFound = (message: string): never => {
    throw new HttpError(404, 'NOT_FOUND', message);
};

export const controllerParams = z.object({
    controllerId: z.string().min(1),
});

export const toCursor = (value: unknown) => {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
};

export const fromCursor = (cursor: string): unknown => {
    try {
        return JSON.parse(Buffer.from(cursor, 'base64url').toString());
    } catch {
        return null;
    }
};

const json = (statusCode: number, body: unknown): HttpResult => ({
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
});

const parse = <T extends z.ZodType | undefined>(schema: T, input: unknown, name: string): Output<T> => {
    if (!schema) {
        return undefined as Output<T>;
    }

    const result = schema.safeParse(input);

    if (!result.success) {
        const details = result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));

        return badRequest(`Invalid ${name}`, details);
    }

    return result.data as Output<T>;
};

const toBody = (event: HttpEvent): unknown => {
    if (!event.body) {
        return undefined;
    }

    const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;

    try {
        return JSON.parse(raw);
    } catch {
        return badRequest('Request body must be valid JSON');
    }
};

const toRequest = <S extends RequestSchema>(schemas: S, event: HttpEvent): Request<S> => {
    const userId = event.requestContext.authorizer?.lambda?.userId;

    if (!userId) {
        throw new HttpError(401, 'UNAUTHORIZED', 'Missing or invalid credentials');
    }

    const params = parse<S['params']>(schemas.params, event.pathParameters, 'path parameters');
    const query = parse<S['query']>(schemas.query, event.queryStringParameters ?? {}, 'query parameters');
    const body = parse<S['body']>(schemas.body, toBody(event), 'request body');

    return { userId, params, query, body };
};

const toErrorResult = (error: unknown) => {
    if (!(error instanceof HttpError)) {
        console.error('request failed:', error);

        return json(500, { error: { code: 'INTERNAL', message: 'Internal Server Error' } });
    }

    const { status, code, message, details } = error;

    return json(status, { error: { code, message, details } });
};

export const defineHandler = <S extends RequestSchema, T>(
    schemas: S,
    handler: (request: Request<S>) => Promise<Response<T>>,
) => async (event: HttpEvent): Promise<HttpResult> => {
    try {
        const request = toRequest(schemas, event);
        const { data, meta, status = 200 } = await handler(request);

        return json(status, { data, meta: { ...meta, requestId: event.requestContext.requestId } });
    } catch (error) {
        return toErrorResult(error);
    }
};
