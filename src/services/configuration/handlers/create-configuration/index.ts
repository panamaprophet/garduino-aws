import { randomUUID, UUID } from 'crypto';
import { defineHandler } from '@/lib/http';
import { attachPolicy, attachThingPrincipal, createCertificates, createMqttPolicy, createThing, getRootCACertificate } from '@/lib/iot';
import { createConfiguration } from '../../lib';

export const handler = defineHandler(async (_event, { userId }) => {
    const controllerId = randomUUID();
    const ownerId = userId as UUID;

    const thing = await createThing(controllerId);

    console.log('thing created:', thing);

    const policy = await createMqttPolicy(controllerId);
    const certificates = await createCertificates();
    const rootCertificate = await getRootCACertificate();

    await attachPolicy(policy.policyName!, certificates.certificateArn!);
    await attachThingPrincipal(controllerId, certificates.certificateArn!);

    const configuration = await createConfiguration(controllerId, { ownerId });

    return {
        id: thing.thingName,
        arn: thing.thingArn,
        certificates: {
            root: rootCertificate,
            pem: certificates.certificatePem,
            privateKey: certificates.keyPair?.PrivateKey,
            publicKey: certificates.keyPair?.PublicKey,
        },
        configuration,
    };
});
