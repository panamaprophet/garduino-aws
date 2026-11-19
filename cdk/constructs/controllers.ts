import { Construct } from 'constructs';
import { ArnFormat, Duration, Stack } from 'aws-cdk-lib';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { CfnPolicy } from 'aws-cdk-lib/aws-iot';
import { Auth } from './auth';
import { getFirmwareBaseUrl } from '../lib/firmware';
import { createFunction } from '../lib/function';
import { iotProvisioningPolicy } from '../lib/policies';
import { ServiceProps } from '../lib/service';
import { createTable } from '../lib/table';
import { routes, topics } from '@/services/controllers/controllers.config';

interface ControllersProps extends ServiceProps {
    auth: Auth;
}

const THING_NAME = '${iot:Connection.Thing.ThingName}';

export class Controllers extends Construct {
    constructor(scope: Construct, id: string, { api, auth }: ControllersProps) {
        super(scope, id);

        const stack = Stack.of(this);

        const iotArn = (resource: string, resourceName: string) => stack.formatArn({
            service: 'iot',
            resource,
            resourceName,
            arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
        });

        const devicePolicy = new CfnPolicy(this, 'device-policy', {
            policyName: `${stack.stackName}-device`,
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: 'iot:Connect',
                        Resource: iotArn('client', THING_NAME),
                    },
                    {
                        Effect: 'Allow',
                        Action: ['iot:Publish', 'iot:Receive'],
                        Resource: iotArn('topic', topics.device(THING_NAME)),
                    },
                    {
                        Effect: 'Allow',
                        Action: 'iot:Subscribe',
                        Resource: iotArn('topicfilter', topics.device(THING_NAME)),
                    },
                ],
            },
        });

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
        const provisioning = {
            environment: { ...environment, DEVICE_POLICY_NAME: devicePolicy.ref },
            initialPolicy: [iotProvisioningPolicy],
            memorySize: 256,
            timeout: Duration.seconds(10),
        };

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
        const updateController = createFunction(this, { service: 'controllers', feature: 'update-controller', environment });
        const createController = createFunction(this, { service: 'controllers', feature: 'create-controller', ...provisioning });
        const removeController = createFunction(this, { service: 'controllers', feature: 'remove-controller', ...provisioning });
        const rotateCertificate = createFunction(this, { service: 'controllers', feature: 'rotate-certificate', ...provisioning });
        const sendCommand = createFunction(this, {
            service: 'controllers',
            feature: 'send-command',
            environment: { FIRMWARE_BASE_URL: getFirmwareBaseUrl(this) },
            initialPolicy: [
                new PolicyStatement({
                    actions: ['iot:Publish'],
                    resources: [iotArn('topic', topics.commands('*'))],
                }),
            ],
        });

        table.grantReadData(listControllers);
        table.grantReadData(getController);
        table.grantReadWriteData(updateController);
        table.grantWriteData(createController);
        table.grantReadWriteData(removeController);

        api.addRoute(routes.listControllers, listControllers);
        api.addRoute(routes.createController, createController);
        api.addRoute(routes.getController, getController);
        api.addRoute(routes.updateController, updateController);
        api.addRoute(routes.removeController, removeController);
        api.addRoute(routes.sendCommand, sendCommand);
        api.addRoute(routes.rotateCertificate, rotateCertificate);
    }
}
