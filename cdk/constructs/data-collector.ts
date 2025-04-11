import { join } from 'path';
import { Construct } from 'constructs';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Table, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime, Architecture } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunctionProps, NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { dbPolicy } from '../policies';

export class DataCollector extends Construct {
    table: Table;

    push: NodejsFunction;
    query: NodejsFunction;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const { stackName } = Stack.of(this);

        this.table = new Table(this, 'data-table', {
            tableName: `${stackName}-data-table`,
            partitionKey: { name: 'id', type: AttributeType.STRING },
            sortKey: { name: 'ts', type: AttributeType.NUMBER },
            readCapacity: 1,
            writeCapacity: 1,
            removalPolicy: RemovalPolicy.DESTROY,
        });

        this.table.addGlobalSecondaryIndex({
            indexName: 'controllerId_Index',
            partitionKey: { name: 'controllerId', type: AttributeType.STRING },
            sortKey: { name: 'ts', type: AttributeType.NUMBER },
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

        this.push = new NodejsFunction(this, 'pushDataHandler', {
            ...commonLambdaProps,
            functionName: `${stackName}-push-data`,
            environment: { DATA_TABLE: this.table.tableName },
            handler: 'index.pushData',
            entry: join(__dirname, '../../src/services/data-collector/index.ts'),
        });

        this.query = new NodejsFunction(this, 'queryDataHandler', {
            ...commonLambdaProps,
            functionName: `${stackName}-query-data`,
            environment: { DATA_TABLE: this.table.tableName },
            handler: 'index.queryData',
            entry: join(__dirname, '../../src/services/data-collector/index.ts'),
        });
    }
}
