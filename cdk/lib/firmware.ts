import { Construct } from 'constructs';
import { Stack } from 'aws-cdk-lib';

export const getFirmwareBucketName = (scope: Construct) => `${Stack.of(scope).stackName}-firmware`;

export const getFirmwareBaseUrl = (scope: Construct) => {
    const { region } = Stack.of(scope);

    return `https://${getFirmwareBucketName(scope)}.s3.${region}.amazonaws.com`;
};
