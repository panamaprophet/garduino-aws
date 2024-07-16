import { randomUUID, UUID } from 'crypto';
import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { createController } from '../../../shared/services/iot';
import { createConfiguration } from '../../../shared/services/configuration';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event, context) => {
    try {
        const { jwt } = event.requestContext.authorizer;

        const ownerId = jwt.claims.sub as UUID;
        const controllerId = randomUUID();

        const controller = await createController(controllerId);
        const configuration = await createConfiguration(controllerId, { ownerId });

        return {
            statusCode: 200,
            body: JSON.stringify({ ...controller, configuration }),
        };
    } catch (error) {
        console.error('unexpected error catched:', error);
    }

    return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
    };
};
