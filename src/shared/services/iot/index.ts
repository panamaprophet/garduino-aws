import {
    AttachPolicyCommand,
    AttachThingPrincipalCommand,
    CreateThingCommand,
    CreatePolicyCommand,
    CreateKeysAndCertificateCommand,
    IoTClient,
} from '@aws-sdk/client-iot';
import { UUID } from 'crypto';

export const client = new IoTClient();

const createMqttAllowPolicy = (resource = '*') => ({
    Version: '2012-10-17',
    Statement: [{
        Effect: 'Allow',
        Action: ['iot:Connect', 'iot:Publish', 'iot:Subscribe', 'iot:Receive'],
        Resource: resource,
    }],
});

export const getRootCACertificate = () => {
    return fetch('https://www.amazontrust.com/repository/AmazonRootCA1.pem').then((response) => response.text());
};

export const createCertificates = () => {
    return client.send(new CreateKeysAndCertificateCommand({ setAsActive: true }));
};

export const createThing = (thingName: string) => {
    return client.send(new CreateThingCommand({ thingName }));
};

export const createMqttPolicy = (thingName: string) => client.send(new CreatePolicyCommand({
    policyName: `garduino-mqtt-allow-policy-${thingName}`,
    policyDocument: JSON.stringify(createMqttAllowPolicy()),
}));

export const attachPolicy = (policyName: string, target: string) => {
    return client.send(new AttachPolicyCommand({ policyName, target }));
};

export const attachThingPrincipal = (thingName: string, principal: string) => {
    return client.send(new AttachThingPrincipalCommand({ thingName, principal }));
};

export const createController = async (controllerId: UUID) => {
    const thing = await createThing(controllerId);

    console.log('thing created:', thing);

    const certificates = await createCertificates();
    const controllerRootCert = await getRootCACertificate();

    const controllerCertPem = certificates.certificatePem;
    const controllerPublicKey = certificates.keyPair?.PublicKey;
    const controllerPrivateKey = certificates.keyPair?.PrivateKey;

    console.log('certificates:', { controllerRootCert, controllerCertPem, controllerPublicKey, controllerPrivateKey });

    const policy = await createMqttPolicy(controllerId);

    await attachPolicy(policy.policyName!, certificates.certificateArn!);
    await attachThingPrincipal(controllerId, certificates.certificateArn!);

    return {
        id: controllerId,
        arn: thing.thingArn,
        certificates: {
            root: controllerRootCert,
            pem: controllerCertPem,
            publicKey: controllerPublicKey,
            privateKey: controllerPrivateKey,
        },
    };
};
