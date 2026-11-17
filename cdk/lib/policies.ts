import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

export const iotAdminPolicy = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
        'iot:AttachPolicy',
        'iot:AttachThingPrincipal',
        'iot:CreateKeysAndCertificate',
        'iot:CreatePolicy',
        'iot:CreateThing',
    ],
    resources: ['*'],
});
