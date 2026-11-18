import { Construct } from 'constructs';
import { HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { createFunction } from '@cdk/lib/function';
import { iotAdminPolicy } from '@cdk/lib/policies';
import { ServiceProps } from '@cdk/lib/service';
import { createTable } from '@cdk/lib/table';

export class Controllers extends Construct {
    constructor(scope: Construct, id: string, { api }: ServiceProps) {
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

        const listControllers = createFunction(this, { service: 'controllers', feature: 'list-controllers', environment });
        const getController = createFunction(this, { service: 'controllers', feature: 'get-controller', environment });
        const removeController = createFunction(this, { service: 'controllers', feature: 'remove-controller', environment });
        const createController = createFunction(this, {
            service: 'controllers',
            feature: 'create-controller',
            environment,
            initialPolicy: [iotAdminPolicy],
            memorySize: 256,
        });

        table.grantReadData(listControllers);
        table.grantReadData(getController);
        table.grantReadWriteData(removeController);
        table.grantWriteData(createController);

        api.addRoute('/v2/controllers', listControllers);
        api.addRoute('/v2/controllers', createController, { method: HttpMethod.POST });
        api.addRoute('/v2/controllers/{controllerId}', getController);
        api.addRoute('/v2/controllers/{controllerId}', removeController, { method: HttpMethod.DELETE });
    }
}
