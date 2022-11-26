import { APIGatewayEvent } from 'aws-lambda';
import { handleResponse } from '../../../shared/helpers';
import { addControllerData } from '../../../shared/resolvers/data';


export const handler = async (event: APIGatewayEvent) => {
    const { pathParameters } = event;
    const { controllerId } = pathParameters!;
    const payload = JSON.parse(String(event.body));

    if (!controllerId) {
        return handleResponse({ error: 'Invalid controllerId' }, 400);
    }

    if (!payload) {
        return handleResponse({ error: 'Invalid payload' }, 400);
    }

    const result = await addControllerData(controllerId, payload);

    return handleResponse(result);
};


