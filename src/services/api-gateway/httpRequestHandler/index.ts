import { URL } from 'url';
import { APIGatewayEvent } from 'aws-lambda';
import { handleResponse } from '../../../shared/helpers';

const endpoints: { [k: string]: string } = {
    data: `${process.env.DATA_COLLECTOR_URL}/data`,
    configuration: `${process.env.CONTROLLER_CONFIGURATION_URL}/configuration`,
};

export const handler = async (event: APIGatewayEvent) => {
    const {
        httpMethod,
        pathParameters,
        queryStringParameters,
    } = event;

    const service = pathParameters?.service ?? '';
    const proxy = pathParameters?.proxy ?? '';
    const endpoint = endpoints[service];

    if (!endpoint) {
        return handleResponse({ error: 'not found' }, 404);
    }

    const url = new URL(`${endpoint}/${proxy}`);
    const headers: { [k: string]: string } = {};

    Object
        .entries(queryStringParameters || {})
        .forEach(([name, value = '']) => url.searchParams.append(name, value));

    Object
        .entries(event.headers || {})
        .forEach(([name, value = '']) => { headers[name] = value });

    const response = await fetch(url, { headers, method: httpMethod });
    const result = await response.json();

    return handleResponse({ result });
};
