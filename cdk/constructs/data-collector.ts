import { join } from 'path';
import { Construct } from 'constructs';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Table, AttributeType, ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime, Architecture } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunctionProps, NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { dbPolicy } from '../lib/policies';
import { createLogGroup } from '../lib/log-group';

interface DataCollectorProps {
    configurationTable: ITable;
}

export class DataCollector extends Construct {
    table: Table;

    push: NodejsFunction;
    query: NodejsFunction;
    mqttTopicHandler: NodejsFunction;

    constructor(scope: Construct, id: string, props: DataCollectorProps) {
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
            runtime: Runtime.NODEJS_LATEST,
            architecture: Architecture.ARM_64,
            bundling: { minify: true },
            environment: {
                DATA_TABLE: this.table.tableName,
                CONFIGURATION_TABLE: props.configurationTable.tableName,
            },
            initialPolicy: [dbPolicy],
        };

        this.push = new NodejsFunction(this, 'pushDataHandler', {
            ...commonLambdaProps,
            functionName: `${stackName}-push-data`,
            handler: 'index.pushData',
            entry: join(__dirname, '../../src/services/data-collector/index.ts'),
            logGroup: createLogGroup(this, 'pushData'),
        });

        this.query = new NodejsFunction(this, 'queryDataHandler', {
            ...commonLambdaProps,
            functionName: `${stackName}-query-data`,
            handler: 'index.queryData',
            entry: join(__dirname, '../../src/services/data-collector/index.ts'),
            logGroup: createLogGroup(this, 'queryData'),
        });

        this.mqttTopicHandler = new NodejsFunction(this, 'mqttDataTopicHandler', {
            ...commonLambdaProps,
            functionName: `${stackName}-mqtt-data-topic-handler`,
            handler: 'index.mqttDataTopicHandler',
            entry: join(__dirname, '../../src/services/data-collector/index.ts'),
            logGroup: createLogGroup(this, 'mqttDataTopicHandler'),
        });
    }
}
