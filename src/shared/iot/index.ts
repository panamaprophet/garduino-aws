import {
    AttachPolicyCommand,
    AttachThingPrincipalCommand,
    CertificateStatus,
    CreateKeysAndCertificateCommand,
    CreateThingCommand,
    IoTClient,
    ListThingPrincipalsCommand,
    ResourceNotFoundException,
    UpdateCertificateCommand,
} from '@aws-sdk/client-iot';

export const client = new IoTClient();

const ROOT_CERTIFICATE_URL = 'https://www.amazontrust.com/repository/AmazonRootCA1.pem';

const getRootCACertificate = async () => {
    const response = await fetch(ROOT_CERTIFICATE_URL);

    return response.text();
};

export const createThing = (thingName: string) => {
    return client.send(new CreateThingCommand({ thingName }));
};

export const listThingCertificates = async (thingName: string) => {
    const result = await client.send(new ListThingPrincipalsCommand({ thingName })).catch((error) => {
        if (error instanceof ResourceNotFoundException) {
            return { principals: [] };
        }

        throw error;
    });

    return (result.principals ?? []).filter((principal) => principal.includes(':cert/'));
};

export const issueCertificate = async (thingName: string, policyName: string) => {
    const { certificateArn, certificatePem, keyPair } = await client.send(new CreateKeysAndCertificateCommand({ setAsActive: true }));

    await client.send(new AttachPolicyCommand({ policyName, target: certificateArn }));
    await client.send(new AttachThingPrincipalCommand({ thingName, principal: certificateArn }));

    return {
        root: await getRootCACertificate(),
        pem: certificatePem!,
        privateKey: keyPair!.PrivateKey!,
        publicKey: keyPair!.PublicKey!,
    };
};

export const deactivateCertificate = async (certificateArn: string) => {
    const certificateId = certificateArn.split('/').pop()!;

    await client.send(new UpdateCertificateCommand({ certificateId, newStatus: CertificateStatus.INACTIVE }));
};
