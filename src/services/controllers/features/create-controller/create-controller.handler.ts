import { randomUUID } from 'crypto';
import { defineHandler } from '@/shared/http';
import { attachPolicy, attachThingPrincipal, createCertificates, createMqttPolicy, createThing, getRootCACertificate } from '@/shared/iot';
import { saveController } from '../../entity/controller.repository';

export const handler = defineHandler(async (_event, { userId }) => {
    const controllerId = randomUUID();

    await createThing(controllerId);

    const policy = await createMqttPolicy(controllerId);
    const certificates = await createCertificates();
    const rootCertificate = await getRootCACertificate();

    await attachPolicy(policy.policyName!, certificates.certificateArn!);
    await attachThingPrincipal(controllerId, certificates.certificateArn!);

    const controller = await saveController({
        controllerId,
        ownerId: userId,
        createdAt: new Date().toISOString(),
    });

    return {
        ...controller,
        certificates: {
            root: rootCertificate,
            pem: certificates.certificatePem,
            privateKey: certificates.keyPair?.PrivateKey,
            publicKey: certificates.keyPair?.PublicKey,
        },
    };
});
