import { join } from 'path';
import { Construct } from 'constructs';
import { Duration, Stack } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { createLogGroup } from './log-group';

interface FeatureFunctionProps {
    service: string;
    feature: string;
    environment?: Record<string, string>;
    initialPolicy?: PolicyStatement[];
    memorySize?: number;
    timeout?: Duration;
}

export const createFunction = (scope: Construct, props: FeatureFunctionProps) => {
    const { stackName } = Stack.of(scope);
    const { service, feature, ...rest } = props;

    return new NodejsFunction(scope, feature, {
        ...rest,
        functionName: `${stackName}-${feature}`,
        entry: join(__dirname, `../../src/services/${service}/features/${feature}/${feature}.handler.ts`),
        handler: 'handler',
        runtime: Runtime.NODEJS_LATEST,
        architecture: Architecture.ARM_64,
        bundling: {
            minify: true,
            externalModules: ['@aws-sdk/*'],
        },
        logGroup: createLogGroup(scope, feature),
    });
};
