import { APIGatewayEvent } from 'aws-lambda';
import { addControllerEvent } from '../../lib/add-controller-event';

export const handler = async (event: APIGatewayEvent) => {
    const { pathParameters } = event;
    const { controllerId } = pathParameters!;
    const payload = JSON.parse(String(event.body));

    if (!controllerId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid controllerId' }),
        };
    }

    if (!payload) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid payload' }),
        };
    }

    return addControllerEvent(controllerId, payload);
};
