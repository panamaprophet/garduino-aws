import { APIGatewayEvent } from 'aws-lambda';
import { handleResponse } from '@/lib/response';
import { getControllerConfiguration, getControllerConfigurationRaw } from '../lib';


export const handler = async (event: APIGatewayEvent) => {
    const { pathParameters, queryStringParameters} = event;
    const { controllerId } = pathParameters!;
    const isRaw = queryStringParameters?.raw;

    const configuration = isRaw
        ? await getControllerConfigurationRaw(controllerId!)
        : await getControllerConfiguration(controllerId!);

    return handleResponse(configuration);
};
