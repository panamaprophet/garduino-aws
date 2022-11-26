import { APIGatewayEvent } from 'aws-lambda';
import { handleResponse } from '../../../shared/helpers';
import { getControllerConfiguration } from '../../../shared/resolvers/configuration';


export const handler = async (event: APIGatewayEvent) => {
    const { pathParameters } = event;
    const { controllerId } = pathParameters!;
    const configuration = await getControllerConfiguration(controllerId!);
    
    return handleResponse(configuration);
};
