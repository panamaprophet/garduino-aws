import { APIGatewayEvent } from 'aws-lambda';
import { handleResponse } from '../../../shared/helpers';
import { getControllerEvents, getControllerEventsByType } from '../../../shared/resolvers/data';


export const handler = async (event: APIGatewayEvent) => {
    const {
        pathParameters,
        queryStringParameters,
    } = event;

    const { controllerId } = pathParameters!;
    const { eventType } = queryStringParameters || {};

    if (!controllerId) {
        return handleResponse({ error: 'Invalid controllerId' }, 500);
    }

    const result =
        (eventType)
            ? await getControllerEventsByType(controllerId, eventType)
            : await getControllerEvents(controllerId);

    return handleResponse(result);
};
