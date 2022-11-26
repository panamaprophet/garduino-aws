import { APIGatewayEvent } from 'aws-lambda';
import { handleResponse } from '../../../shared/helpers';
import { removeConnection, storeConnection } from '../../../shared/resolvers/ws';


export const handler = async (event: APIGatewayEvent) => {
    const { requestContext, queryStringParameters } = event;
    const { connectionId, eventType } = requestContext;
    const { controllerId } = queryStringParameters || {};
    const isConnectEvent = eventType === 'CONNECT';

    if (!connectionId) {
        return handleResponse({ error: 'Invalid connectionId' }, 500);
    }

    if (isConnectEvent && !controllerId) {
        return handleResponse({ error: 'Invalid controllerId' }, 500);
    }

    const result = isConnectEvent
        ? await storeConnection(connectionId, controllerId!)
        : await removeConnection(connectionId);

    return handleResponse(result);
};
