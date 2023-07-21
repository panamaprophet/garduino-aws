import { APIGatewayEvent } from 'aws-lambda';
import { handleResponse } from '../../../shared/helpers';
import { getControllerConfiguration, getControllerConfigurationRaw } from '../../../shared/resolvers/configuration';


export const handler = async (event: APIGatewayEvent) => {
    const { pathParameters, queryStringParameters} = event;
    const { controllerId } = pathParameters!;
    const isRaw = queryStringParameters?.raw;

    const configuration = isRaw
        ? await getControllerConfigurationRaw(controllerId!)
        : await getControllerConfiguration(controllerId!);

    return handleResponse(configuration);
};
