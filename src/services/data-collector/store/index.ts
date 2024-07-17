import { APIGatewayEvent } from 'aws-lambda';
import { handleResponse } from '@/shared/helpers';
import { addControllerEvent } from '@/shared/services/data-сollector';


export const handler = async (event: APIGatewayEvent) => {
    const { pathParameters } = event;
    const { controllerId } = pathParameters!;
    const payload = JSON.parse(String(event.body));

    if (!controllerId) {
        return handleResponse({ error: 'Invalid controllerId' }, 500);
    }

    if (!payload) {
        return handleResponse({ error: 'Invalid payload' }, 500);
    }

    const result = await addControllerEvent(controllerId, payload);

    return handleResponse(result);
};


