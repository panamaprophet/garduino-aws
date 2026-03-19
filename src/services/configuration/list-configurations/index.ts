import { APIGatewayEventRequestContextJWTAuthorizer, APIGatewayProxyEventBase } from 'aws-lambda';
import { handleResponse } from '@/lib/response';
import { getControllerIdsByOwnerId } from '../lib';


export const handler = async (event: APIGatewayProxyEventBase<APIGatewayEventRequestContextJWTAuthorizer>) => {
    const { requestContext } = event;
    const { authorizer } = requestContext;
    const { jwt } = authorizer;

    const userId = jwt.claims.sub;

    if (!userId) {
        return handleResponse({ message: 'no user found' }, 401);
    }

    const controllerIds = await getControllerIdsByOwnerId(String(userId));

    return handleResponse(controllerIds);
};
