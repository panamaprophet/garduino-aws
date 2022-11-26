import { APIGatewayEvent } from 'aws-lambda';
import { handleResponse } from '../../../shared/helpers';
import { removeConnection, storeConnection } from '../../../shared/resolvers/ws';


export const handler = async (event: APIGatewayEvent) => {
    const { requestContext, queryStringParameters } = event;
    const { connectionId, eventType } = requestContext;
    const { controllerId } = queryStringParameters || {};
    const isConnectEvent = eventType === 'CONNECT';

    if (!connectionId) {
        return handleResponse('Invalid connectionId', 400);
    }

    if (isConnectEvent && !controllerId) {
        return handleResponse('Invalid controllerId', 400);
    }

    const result = isConnectEvent
        ? await storeConnection(connectionId, controllerId!)
        : await removeConnection(connectionId);

    return handleResponse(result);
};
