import { Stack, RemovalPolicy } from 'aws-cdk-lib';
import { Table, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Runtime, Architecture } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunctionProps, NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join } from 'path';

export class Configuration extends Construct {
    table: Table;

    list: NodejsFunction;
    get: NodejsFunction;
    create: NodejsFunction;
    remove: NodejsFunction;
    update: NodejsFunction;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const { stackName } = Stack.of(this);

        this.table = new Table(this, 'configuration-table', {
            tableName: `${stackName}-configuration-table`,
            partitionKey: { name: 'controllerId', type: AttributeType.STRING },
            readCapacity: 1,
            writeCapacity: 1,
            removalPolicy: RemovalPolicy.DESTROY,
        });

        this.table.addGlobalSecondaryIndex({
            indexName: 'ownerId_Index',
            partitionKey: { name: 'ownerId', type: AttributeType.STRING },
            sortKey: { name: 'controllerId', type: AttributeType.STRING },
            readCapacity: 1,
            writeCapacity: 1,
        });

        const adminIoTPolicy = new PolicyStatement({
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

        const dbPolicy = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['dynamodb:*'],
            resources: [this.table.tableArn, `${this.table.tableArn}/index/ownerId_Index`],
        });

        const commonLambdaProps: Partial<NodejsFunctionProps> = {
            runtime: Runtime.NODEJS_20_X,
            architecture: Architecture.ARM_64,
            bundling: { minify: true },
            environment: { CONFIGURATION_TABLE: this.table.tableName },
            initialPolicy: [dbPolicy],
        };

        this.get = new NodejsFunction(this, 'getConfiguration', {
            ...commonLambdaProps,
            handler: 'index.getConfiguration',
            entry: join(__dirname, '../src/services/configuration/index.ts'),
        });

        this.list = new NodejsFunction(this, 'listConfigurations', {
            ...commonLambdaProps,
            handler: 'index.listConfigurations',
            entry: join(__dirname, '../src/services/configuration/index.ts'),
        });

        this.create = new NodejsFunction(this, 'createConfiguration', {
            ...commonLambdaProps,
            memorySize: 256,
            initialPolicy: [adminIoTPolicy, dbPolicy],
            handler: 'index.createConfiguration',
            entry: join(__dirname, '../src/services/configuration/index.ts'),
        });

        this.remove = new NodejsFunction(this, 'removeRonfiguration', {
            ...commonLambdaProps,
            initialPolicy: [adminIoTPolicy, dbPolicy],
            handler: 'index.removeConfiguration',
            entry: join(__dirname, '../src/services/configuration/index.ts'),
        });

        this.update = new NodejsFunction(this, 'updateConfiguration', {
            ...commonLambdaProps,
            handler: 'index.updateConfiguration',
            entry: join(__dirname, '../src/services/configuration/index.ts'),
        });
    }
}
