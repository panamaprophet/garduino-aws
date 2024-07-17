import { APIGatewayEvent } from 'aws-lambda';
import { handleResponse } from '@/shared/helpers';
import { removeControllerConfiguration } from '@/shared/services/configuration';


export const handler = async (event: APIGatewayEvent) => {
    const { pathParameters } = event;
    const { controllerId } = pathParameters!;

    const result = await removeControllerConfiguration(controllerId!);

    return handleResponse({ success: result });
};
