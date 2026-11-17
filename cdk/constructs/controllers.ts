import { Construct } from 'constructs';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { createFunction } from '../lib/function';
import { iotAdminPolicy } from '../lib/policies';
import { createTable } from '../lib/table';

export class Controllers extends Construct {
    readonly list: NodejsFunction;
    readonly create: NodejsFunction;
    readonly get: NodejsFunction;
    readonly remove: NodejsFunction;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const table = createTable(this, 'controllers', {
            partitionKey: { name: 'controllerId', type: AttributeType.STRING },
            readCapacity: 2,
            writeCapacity: 1,
        });

        table.addGlobalSecondaryIndex({
            indexName: 'ownerId_Index',
            partitionKey: { name: 'ownerId', type: AttributeType.STRING },
            sortKey: { name: 'controllerId', type: AttributeType.STRING },
            readCapacity: 1,
            writeCapacity: 1,
        });

        const environment = { CONTROLLERS_TABLE: table.tableName };

        this.list = createFunction(this, { service: 'controllers', handler: 'listControllers', environment });
        this.get = createFunction(this, { service: 'controllers', handler: 'getController', environment });
        this.remove = createFunction(this, { service: 'controllers', handler: 'removeController', environment });
        this.create = createFunction(this, {
            service: 'controllers',
            handler: 'createController',
            environment,
            initialPolicy: [iotAdminPolicy],
            memorySize: 256,
        });

        table.grantReadData(this.list);
        table.grantReadData(this.get);
        table.grantReadWriteData(this.remove);
        table.grantWriteData(this.create);
    }
}
