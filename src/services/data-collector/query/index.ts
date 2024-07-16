import { APIGatewayEvent } from 'aws-lambda';
import { handleResponse } from '../../../shared/helpers';
import { getControllerEvents } from '../../../shared/services/data-сollector';


export const handler = async (event: APIGatewayEvent) => {
    const { pathParameters, queryStringParameters } = event;
    const { controllerId } = pathParameters!;
    const { startDate, endDate } = queryStringParameters || {};

    if (!controllerId) {
        return handleResponse({ error: 'Invalid controllerId' }, 500);
    }

    const result = await getControllerEvents(controllerId, { startDate, endDate });

    return handleResponse(result);
};
