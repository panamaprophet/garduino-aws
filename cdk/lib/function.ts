import { join } from 'path';
import { Construct } from 'constructs';
import { Stack } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { createLogGroup } from './log-group';

interface ServiceFunctionProps {
    service: string;
    handler: string;
    environment?: Record<string, string>;
    initialPolicy?: PolicyStatement[];
    memorySize?: number;
}

const toKebabCase = (value: string) => value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

export const createFunction = (scope: Construct, props: ServiceFunctionProps) => {
    const { stackName } = Stack.of(scope);
    const { service, handler, ...rest } = props;

    return new NodejsFunction(scope, handler, {
        ...rest,
        functionName: `${stackName}-${service}-${toKebabCase(handler)}`,
        entry: join(__dirname, `../../src/services/${service}/index.ts`),
        handler: `index.${handler}`,
        runtime: Runtime.NODEJS_LATEST,
        architecture: Architecture.ARM_64,
        bundling: { minify: true },
        logGroup: createLogGroup(scope, handler),
    });
};
