import { join } from 'path';
import { Construct } from 'constructs';
import { ArnFormat, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Table, TableProps } from 'aws-cdk-lib/aws-dynamodb';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import type { Api } from '../constructs/http-api';
import type { Mqtt } from '../constructs/mqtt-api';

export interface ServiceProps {
    api: Api;
    mqtt: Mqtt;
}

export interface FunctionProps {
    environment?: Record<string, string>;
    initialPolicy?: PolicyStatement[];
    memorySize?: number;
    timeout?: Duration;
}

interface FeatureProps extends FunctionProps {
    service: string;
    feature: string;
}

type TableKeyProps = Pick<TableProps, 'partitionKey' | 'sortKey' | 'readCapacity' | 'writeCapacity'>;

export const createLogGroup = (scope: Construct, id: string) => {
    return new LogGroup(scope, `${id}LogGroup`, {
        retention: RetentionDays.TWO_WEEKS,
        removalPolicy: RemovalPolicy.DESTROY,
    });
};

export const createFunction = (scope: Construct, { service, feature, ...props }: FeatureProps) => {
    const { stackName } = Stack.of(scope);

    return new NodejsFunction(scope, feature, {
        ...props,
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

export const createTable = (scope: Construct, name: string, props: TableKeyProps) => {
    const { stackName } = Stack.of(scope);

    return new Table(scope, `${name}-table`, {
        ...props,
        tableName: `${stackName}-${name}`,
        removalPolicy: RemovalPolicy.RETAIN,
        deletionProtection: true,
    });
};

export const iotArn = (scope: Construct, resource: string, resourceName: string) => {
    return Stack.of(scope).formatArn({
        service: 'iot',
        resource,
        resourceName,
        arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
    });
};
