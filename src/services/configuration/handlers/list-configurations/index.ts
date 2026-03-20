import { APIGatewayEventRequestContextJWTAuthorizer, APIGatewayProxyEventBase } from 'aws-lambda';
import { getControllerIdsByOwnerId } from '../../lib';

export const handler = async (event: APIGatewayProxyEventBase<APIGatewayEventRequestContextJWTAuthorizer>) => {
    const { requestContext } = event;
    const { authorizer } = requestContext;
    const { jwt } = authorizer;

    const userId = jwt.claims.sub;

    if (!userId) {
        return {
            statusCode: 401,
            body: JSON.stringify({ message: 'no user found' }),
        };
    }

    return getControllerIdsByOwnerId(String(userId));
};
