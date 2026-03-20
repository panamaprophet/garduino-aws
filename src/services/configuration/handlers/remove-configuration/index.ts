import { APIGatewayEvent } from 'aws-lambda';
import { removeControllerConfiguration } from '../../lib';

export const handler = async (event: APIGatewayEvent) => {
    const { pathParameters } = event;
    const { controllerId } = pathParameters!;

    if (!controllerId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Controller ID is required' }),
        };
    }

    const result = await removeControllerConfiguration(controllerId);

    return { success: result };
};
