import {
    AttachPolicyCommand,
    AttachThingPrincipalCommand,
    CertificateStatus,
    CreateKeysAndCertificateCommand,
    CreateThingCommand,
    DescribeEndpointCommand,
    IoTClient,
    ListThingPrincipalsCommand,
    ResourceNotFoundException,
    UpdateCertificateCommand,
} from '@aws-sdk/client-iot';
import { env } from '@/shared/env';

const ROOT_CERTIFICATE_URL = 'https://www.amazontrust.com/repository/AmazonRootCA1.pem';

const client = new IoTClient({});

const getRootCertificate = async () => {
    const response = await fetch(ROOT_CERTIFICATE_URL);

    return response.text();
};

export const getEndpoint = async () => {
    const { endpointAddress } = await client.send(new DescribeEndpointCommand({ endpointType: 'iot:Data-ATS' }));

    if (!endpointAddress) {
        throw new Error('IoT returned no data endpoint');
    }

    return endpointAddress;
};

export const createThing = async (thingName: string) => {
    await client.send(new CreateThingCommand({ thingName }));

    return thingName;
};

export const listThingCertificates = async (thingName: string) => {
    const result = await client.send(new ListThingPrincipalsCommand({ thingName })).catch((error) => {
        if (error instanceof ResourceNotFoundException) {
            return { principals: [] };
        }

        throw error;
    });

    const principals = result.principals ?? [];

    return principals.filter((principal) => principal.includes(':cert/'));
};

export const issueCertificate = async (thingName: string) => {
    const policyName = env('DEVICE_POLICY_NAME');

    const { certificateArn, certificatePem, keyPair } = await client.send(new CreateKeysAndCertificateCommand({ setAsActive: true }));

    if (!certificateArn || !certificatePem || !keyPair?.PrivateKey || !keyPair.PublicKey) {
        throw new Error('IoT returned an incomplete certificate');
    }

    await client.send(new AttachPolicyCommand({ policyName, target: certificateArn }));
    await client.send(new AttachThingPrincipalCommand({ thingName, principal: certificateArn }));

    const root = await getRootCertificate();

    return { root, pem: certificatePem, privateKey: keyPair.PrivateKey, publicKey: keyPair.PublicKey };
};

export const deactivateCertificate = async (certificateArn: string) => {
    const [, certificateId] = certificateArn.split('/');

    await client.send(new UpdateCertificateCommand({ certificateId, newStatus: CertificateStatus.INACTIVE }));

    return certificateId;
};
