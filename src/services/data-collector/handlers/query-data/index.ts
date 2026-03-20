import { APIGatewayEvent } from 'aws-lambda';
import { getControllerEvents } from '../../lib/get-controller-events';

export const handler = async (event: APIGatewayEvent) => {
    const { pathParameters, queryStringParameters } = event;
    const { controllerId } = pathParameters!;
    const { startDate, endDate } = queryStringParameters || {};

    if (!controllerId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid controllerId' }),
        };
    }

    return getControllerEvents(controllerId, { startDate, endDate });
};
