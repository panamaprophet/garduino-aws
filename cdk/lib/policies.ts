import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

export const iotProvisioningPolicy = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
        'iot:CreateThing',
        'iot:ListThingPrincipals',
        'iot:AttachThingPrincipal',
        'iot:CreateKeysAndCertificate',
        'iot:UpdateCertificate',
        'iot:AttachPolicy',
    ],
    resources: ['*'],
});
