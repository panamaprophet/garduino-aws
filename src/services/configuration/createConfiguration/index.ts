import { randomUUID, UUID } from 'crypto';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { decodeJwt } from '../../../shared/services/jwt';
import { createController } from '../../../shared/services/iot';
import { createConfiguration } from '../../../shared/resolvers/configuration';

export const handler: APIGatewayProxyHandler = async (event, context) => {
    try {
        console.log('event:', event, context);

        const authorization = event.headers.authorization ?? '';
        const [, token] = authorization.split(' ');
        const jwt = await decodeJwt(token ?? '');

        console.log('decoded jwt:', jwt);

        const ownerId = jwt!.sub as UUID;
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
