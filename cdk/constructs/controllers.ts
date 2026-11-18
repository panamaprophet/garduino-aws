import { Construct } from 'constructs';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { Auth } from './auth';
import { createFunction } from '../lib/function';
import { iotAdminPolicy } from '../lib/policies';
import { ServiceProps } from '../lib/service';
import { createTable } from '../lib/table';
import { routes } from '@/services/controllers/controllers.config';

interface ControllersProps extends ServiceProps {
    auth: Auth;
}

export class Controllers extends Construct {
    constructor(scope: Construct, id: string, { api, auth }: ControllersProps) {
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

        const authorizeRequest = createFunction(this, {
            service: 'controllers',
            feature: 'authorize-request',
            environment: {
                ...environment,
                USER_POOL_ID: auth.userPoolId,
                WEB_CLIENT_ID: auth.webClientId,
                MCP_CLIENT_ID: auth.mcpClientId,
            },
        });

        table.grantReadData(authorizeRequest);

        api.useAuthorizer(authorizeRequest);

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

        api.addRoute(routes.listControllers, listControllers);
        api.addRoute(routes.createController, createController);
        api.addRoute(routes.getController, getController);
        api.addRoute(routes.removeController, removeController);
    }
}
