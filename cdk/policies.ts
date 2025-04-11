import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;

export const dbPolicy = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['dynamodb:*'],
    resources: [
        `arn:aws:dynamodb:${region}:${account}:table/garduino-*`,
        `arn:aws:dynamodb:${region}:${account}:table/garduino-*/index/*`,
    ],
});

export const iotPolicy = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['iot:Publish', 'iot:Connect'],
    resources: [
        `arn:aws:iot:${region}:${account}:topic/controllers/*`,
    ],
});

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
