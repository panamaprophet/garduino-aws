import { randomUUID, UUID } from 'crypto';
import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { attachPolicy, attachThingPrincipal, createCertificates, createMqttPolicy, createThing, getRootCACertificate } from '@/shared/services/iot';
import { createConfiguration } from '@/shared/services/configuration';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event, context) => {
    try {
        const { jwt } = event.requestContext.authorizer;

        const controllerId = randomUUID();
        const ownerId = jwt.claims.sub as UUID;

        const thing = await createThing(controllerId);

        console.log('thing created:', thing);

        const policy = await createMqttPolicy(controllerId);
        const certificates = await createCertificates();
        const rootCertificate = await getRootCACertificate();

        await attachPolicy(policy.policyName!, certificates.certificateArn!);
        await attachThingPrincipal(controllerId, certificates.certificateArn!);

        const configuration = await createConfiguration(controllerId, { ownerId });

        return {
            statusCode: 200,
            body: JSON.stringify({
                id: thing.thingName,
                arn: thing.thingArn,
                certificates: {
                    root: rootCertificate,
                    pem: certificates.certificatePem,
                    privateKey: certificates.keyPair?.PrivateKey,
                    publicKey: certificates.keyPair?.PublicKey,
                },
                configuration,
            }),
        };
    } catch (error) {
        console.error('unexpected error catched:', error);
    }

    return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
    };
};
