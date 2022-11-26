import { APIGatewayEvent } from 'aws-lambda';
import { handleResponse } from '../../../shared/helpers';
import { getConnectionId, sendMessage } from '../../../shared/resolvers/ws';

export const handler = async (event: APIGatewayEvent) => {
    const { controllerId } = event.pathParameters!;

    if (!controllerId) {
        return handleResponse({ error: 'Invalid controllerId' }, 500);
    }

    const connectionId = await getConnectionId(controllerId);

    if (!connectionId) {
        return handleResponse({ error: 'controller offline' }, 500);
    }

    await sendMessage(connectionId, { action: 'actions/reboot' });

    return handleResponse({ success: true });
};
