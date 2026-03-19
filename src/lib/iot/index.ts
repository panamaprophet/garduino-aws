import {
    AttachPolicyCommand,
    AttachThingPrincipalCommand,
    CreateThingCommand,
    CreatePolicyCommand,
    CreateKeysAndCertificateCommand,
    IoTClient,
} from '@aws-sdk/client-iot';

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
