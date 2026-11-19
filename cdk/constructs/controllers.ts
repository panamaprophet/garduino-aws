import { Construct } from 'constructs';
import { Duration, Stack } from 'aws-cdk-lib';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { CfnPolicy } from 'aws-cdk-lib/aws-iot';
import { Auth } from './auth';
import { createFunction, createTable, FunctionProps, iotArn, ServiceProps } from '../lib';
import { routes, topics } from '@/services/controllers/controllers.config';

interface ControllersProps extends ServiceProps {
    auth: Auth;
    firmwareBaseUrl: string;
}

const THING_NAME = '${iot:Connection.Thing.ThingName}';

export class Controllers extends Construct {
    constructor(scope: Construct, id: string, { api, auth, firmwareBaseUrl }: ControllersProps) {
        super(scope, id);

        const { stackName } = Stack.of(this);

        const devicePolicy = new CfnPolicy(this, 'device-policy', {
            policyName: `${stackName}-device`,
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: 'iot:Connect',
                        Resource: iotArn(this, 'client', THING_NAME),
                    },
                    {
                        Effect: 'Allow',
                        Action: ['iot:Publish', 'iot:Receive'],
                        Resource: iotArn(this, 'topic', topics.device(THING_NAME)),
                    },
                    {
                        Effect: 'Allow',
                        Action: 'iot:Subscribe',
                        Resource: iotArn(this, 'topicfilter', topics.device(THING_NAME)),
                    },
                ],
            },
        });

        const provisioningPolicy = new PolicyStatement({
            actions: [
                'iot:CreateThing',
                'iot:ListThingPrincipals',
                'iot:AttachThingPrincipal',
                'iot:CreateKeysAndCertificate',
                'iot:UpdateCertificate',
                'iot:AttachPolicy',
            ],
            resources: ['*'],
        });

        const commandsPolicy = new PolicyStatement({
            actions: ['iot:Publish'],
            resources: [iotArn(this, 'topic', topics.commands('*'))],
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
            initialPolicy: [provisioningPolicy],
            memorySize: 256,
            timeout: Duration.seconds(10),
        };

        const createHandler = (feature: string, props?: FunctionProps) => {
            return createFunction(this, { service: 'controllers', feature, environment, ...props });
        };

        const authorizeRequest = createHandler('authorize-request', {
            environment: {
                ...environment,
                USER_POOL_ID: auth.userPoolId,
                WEB_CLIENT_ID: auth.webClientId,
                MCP_CLIENT_ID: auth.mcpClientId,
            },
        });

        table.grantReadData(authorizeRequest);

        api.useAuthorizer(authorizeRequest);

        const listControllers = createHandler('list-controllers');
        const getController = createHandler('get-controller');
        const updateController = createHandler('update-controller');
        const createController = createHandler('create-controller', provisioning);
        const removeController = createHandler('remove-controller', provisioning);
        const rotateCertificate = createHandler('rotate-certificate', provisioning);
        const sendCommand = createHandler('send-command', {
            environment: { FIRMWARE_BASE_URL: firmwareBaseUrl },
            initialPolicy: [commandsPolicy],
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
