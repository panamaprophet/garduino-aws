import { APIGatewayEvent } from 'aws-lambda';
import { setControllerConfiguration } from '../../lib';

export const handler = async (event: APIGatewayEvent) => {
    const { pathParameters } = event;
    const { controllerId } = pathParameters!;
    const configuration = JSON.parse(String(event.body));

    if (!controllerId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Controller ID is required' }),
        };
    }

    await setControllerConfiguration(controllerId, configuration);

    return { controllerId, ...configuration };
};
