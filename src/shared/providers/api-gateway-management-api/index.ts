import { ApiGatewayManagementApiClient } from '@aws-sdk/client-apigatewaymanagementapi';

export const client = new ApiGatewayManagementApiClient({
    endpoint: process.env.API_URL,
});
