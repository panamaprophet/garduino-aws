import { join } from 'path';
import { Construct } from 'constructs';
import { Stack, RemovalPolicy } from 'aws-cdk-lib';
import { Table, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime, Architecture } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunctionProps, NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { dbPolicy, iotAdminPolicy } from '../policies';

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

        const commonLambdaProps: Partial<NodejsFunctionProps> = {
            runtime: Runtime.NODEJS_20_X,
            architecture: Architecture.ARM_64,
            bundling: { minify: true },
            environment: { CONFIGURATION_TABLE: this.table.tableName },
            initialPolicy: [dbPolicy],
        };

        this.get = new NodejsFunction(this, 'getConfiguration', {
            ...commonLambdaProps,
            functionName: `${stackName}-get-configuration`,
            handler: 'index.getConfiguration',
            entry: join(__dirname, '../../src/services/configuration/index.ts'),
        });

        this.list = new NodejsFunction(this, 'listConfigurations', {
            ...commonLambdaProps,
            functionName: `${stackName}-list-configurations`,
            handler: 'index.listConfigurations',
            entry: join(__dirname, '../../src/services/configuration/index.ts'),
        });

        this.create = new NodejsFunction(this, 'createConfiguration', {
            ...commonLambdaProps,
            functionName: `${stackName}-create-configuration`,
            memorySize: 256,
            initialPolicy: [iotAdminPolicy, dbPolicy],
            handler: 'index.createConfiguration',
            entry: join(__dirname, '../../src/services/configuration/index.ts'),
        });

        this.remove = new NodejsFunction(this, 'removeRonfiguration', {
            ...commonLambdaProps,
            functionName: `${stackName}-remove-configuration`,
            initialPolicy: [iotAdminPolicy, dbPolicy],
            handler: 'index.removeConfiguration',
            entry: join(__dirname, '../../src/services/configuration/index.ts'),
        });

        this.update = new NodejsFunction(this, 'updateConfiguration', {
            ...commonLambdaProps,
            functionName: `${stackName}-update-configuration`,
            handler: 'index.updateConfiguration',
            entry: join(__dirname, '../../src/services/configuration/index.ts'),
        });
    }
}
