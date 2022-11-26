import { APIGatewayEvent } from 'aws-lambda';
import { handleResponse } from '../../../shared/helpers';
import { getConnectionId } from '../../../shared/resolvers/ws';


export const handler = async (event: APIGatewayEvent) => {
    const { controllerId } = event.pathParameters!;

    if (!controllerId) {
        return handleResponse({ error: 'Invalid controllerId' }, 500);
    }

    const connectionId = await getConnectionId(controllerId);

    return handleResponse({
        isOnline: Boolean(connectionId),
    });
};
