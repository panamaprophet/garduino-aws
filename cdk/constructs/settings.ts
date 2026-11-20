import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { routes, topics } from '@/services/settings/settings.config';
import { createFunction, createTable, type FunctionProps, iotArn, type ServiceProps } from '../lib';

export class Settings extends Construct {
    constructor(scope: Construct, id: string, { api, mqtt }: ServiceProps) {
        super(scope, id);

        const table = createTable(this, 'settings', {
            partitionKey: { name: 'controllerId', type: AttributeType.STRING },
            readCapacity: 1,
            writeCapacity: 1,
        });

        const publishPolicy = new PolicyStatement({
            actions: ['iot:Publish'],
            resources: [iotArn(this, 'topic', topics.settings('*'))],
        });

        const environment = { SETTINGS_TABLE: table.tableName };

        const createHandler = (feature: string, props?: FunctionProps) => {
            return createFunction(this, { service: 'settings', feature, environment, ...props });
        };

        const getSettings = createHandler('get-settings');
        const updateSettings = createHandler('update-settings', { initialPolicy: [publishPolicy] });
        const requestSettings = createHandler('request-settings', { initialPolicy: [publishPolicy] });

        table.grantReadData(getSettings);
        table.grantReadWriteData(updateSettings);
        table.grantReadData(requestSettings);

        api.addRoute(routes.getSettings, getSettings);
        api.addRoute(routes.updateSettings, updateSettings);

        mqtt.addTopicRule({
            id: 'settings-request',
            topic: topics.request,
            handler: requestSettings,
            select: 'topic(2) AS controllerId',
        });
    }
}
