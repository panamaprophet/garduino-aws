import { APIGatewayEvent } from 'aws-lambda';
import { getControllerConfiguration, getControllerConfigurationRaw } from '../../lib';

export const handler = async (event: APIGatewayEvent) => {
    const { pathParameters, queryStringParameters} = event;
    const { controllerId } = pathParameters!;
    const isRaw = queryStringParameters?.raw;

    return isRaw
        ? await getControllerConfigurationRaw(controllerId!)
        : await getControllerConfiguration(controllerId!);
};
