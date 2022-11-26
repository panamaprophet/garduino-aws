import { APIGatewayEvent } from 'aws-lambda';
import { handleResponse } from '../../../shared/helpers';
import { getControllerData } from '../../../shared/resolvers/data';


export const handler = async (event: APIGatewayEvent) => {
    const { pathParameters } = event;
    const { controllerId } = pathParameters!;

    if (!controllerId) {
        return handleResponse({ error: 'Invalid controllerId' }, 400);
    }

    const result = await getControllerData(controllerId!);

    return handleResponse(result);
};
