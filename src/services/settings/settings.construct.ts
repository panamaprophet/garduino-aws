import { Construct } from 'constructs';
import { Stack } from 'aws-cdk-lib';
import { HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { createFunction } from '@cdk/lib/function';
import { ServiceProps } from '@cdk/lib/service';
import { createTable } from '@cdk/lib/table';

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
                Stack.of(this).formatArn({ service: 'iot', resource: 'topic', resourceName: 'controllers/*/settings' }),
            ],
        });

        const environment = { SETTINGS_TABLE: table.tableName };

        const getSettings = createFunction(this, { service: 'settings', feature: 'get-settings', environment });
        const updateSettings = createFunction(this, { service: 'settings', feature: 'update-settings', environment });
        const requestSettings = createFunction(this, {
            service: 'settings',
            feature: 'request-settings',
            environment,
            initialPolicy: [publishPolicy],
        });

        table.grantReadData(getSettings);
        table.grantReadWriteData(updateSettings);
        table.grantReadData(requestSettings);

        api.addRoute('/v2/controllers/{controllerId}/settings', getSettings);
        api.addRoute('/v2/controllers/{controllerId}/settings', updateSettings, { method: HttpMethod.PATCH });

        mqtt.addTopicRule({
            topic: 'controllers/+/settings/get',
            handler: requestSettings,
            select: 'topic(2) AS controllerId',
        });
    }
}
