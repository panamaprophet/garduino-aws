import { APIGatewayEvent } from 'aws-lambda';
import { handleResponse } from '@/lib/response';
import { setControllerConfiguration } from '../../lib';


export const handler = async (event: APIGatewayEvent) => {
    const { pathParameters } = event;
    const { controllerId } = pathParameters!;
    const configuration = JSON.parse(String(event.body));

    await setControllerConfiguration(controllerId!, configuration);

    return handleResponse({ controllerId, ...configuration });
};
