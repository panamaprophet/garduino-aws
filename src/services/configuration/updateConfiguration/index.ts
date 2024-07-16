import { APIGatewayEvent } from 'aws-lambda';
import { handleResponse } from '../../../shared/helpers';
import { setControllerConfiguration } from '../../../shared/services/configuration';


export const handler = async (event: APIGatewayEvent) => {
    const { pathParameters } = event;
    const { controllerId } = pathParameters!;
    const configuration = JSON.parse(String(event.body));

    await setControllerConfiguration(controllerId!, configuration);

    return handleResponse({ controllerId, ...configuration });
};
