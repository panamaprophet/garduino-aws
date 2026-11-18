import { APIGatewayRequestAuthorizerEventV2, APIGatewaySimpleAuthorizerWithContextResult } from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { RequestContext } from '@/shared/http';
import { isAccessibleBy } from '../../entity/controller.model';
import { findController } from '../../entity/controller.repository';

type AuthorizerResult = APIGatewaySimpleAuthorizerWithContextResult<RequestContext | Record<string, never>>;

const READ_ONLY_METHODS = ['GET', 'HEAD'];

const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.USER_POOL_ID!,
    tokenUse: 'access',
    clientId: [process.env.WEB_CLIENT_ID!, process.env.MCP_CLIENT_ID!],
});

const deny = (reason: string): AuthorizerResult => {
    console.warn('request denied:', reason);

    return { isAuthorized: false, context: {} };
};

const verifyToken = async (header: string | undefined) => {
    const token = header?.replace(/^Bearer\s+/i, '');

    if (!token) {
        return null;
    }

    try {
        return await verifier.verify(token);
    } catch {
        return null;
    }
};

const isAllowedMethod = (clientId: string, method: string) => {
    return clientId !== process.env.MCP_CLIENT_ID || READ_ONLY_METHODS.includes(method);
};

export const handler = async (event: APIGatewayRequestAuthorizerEventV2): Promise<AuthorizerResult> => {
    const token = await verifyToken(event.headers?.authorization);

    if (!token) {
        return deny('invalid token');
    }

    if (!isAllowedMethod(token.client_id, event.requestContext.http.method)) {
        return deny(`client ${token.client_id} is read-only`);
    }

    const controllerId = event.pathParameters?.controllerId;

    if (controllerId && !isAccessibleBy(await findController(controllerId), token.sub)) {
        return deny(`controller ${controllerId} is not accessible`);
    }

    return { isAuthorized: true, context: { userId: token.sub } };
};
