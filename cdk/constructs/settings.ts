import { Construct } from 'constructs';
import { Stack } from 'aws-cdk-lib';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { createFunction } from '../lib/function';
import { ServiceProps } from '../lib/service';
import { createTable } from '../lib/table';
import { routes, topics } from '@/services/settings/settings.config';

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
            resources: [
                Stack.of(this).formatArn({ service: 'iot', resource: 'topic', resourceName: topics.settings('*') }),
            ],
        });

        const environment = { SETTINGS_TABLE: table.tableName };

        const getSettings = createFunction(this, { service: 'settings', feature: 'get-settings', environment });
        const updateSettings = createFunction(this, {
            service: 'settings',
            feature: 'update-settings',
            environment,
            initialPolicy: [publishPolicy],
        });
        const requestSettings = createFunction(this, {
            service: 'settings',
            feature: 'request-settings',
            environment,
            initialPolicy: [publishPolicy],
        });

        table.grantReadData(getSettings);
        table.grantReadWriteData(updateSettings);
        table.grantReadData(requestSettings);

        api.addRoute(routes.getSettings, getSettings);
        api.addRoute(routes.updateSettings, updateSettings);

        mqtt.addTopicRule({
            topic: topics.request,
            handler: requestSettings,
            select: 'topic(2) AS controllerId',
        });
    }
}
