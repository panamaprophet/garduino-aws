import { Construct } from 'constructs';
import { Stack } from 'aws-cdk-lib';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { createFunction } from '../lib/function';
import { createTable } from '../lib/table';

export class Settings extends Construct {
    readonly get: NodejsFunction;
    readonly update: NodejsFunction;
    readonly request: NodejsFunction;

    constructor(scope: Construct, id: string) {
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

        this.get = createFunction(this, { service: 'settings', handler: 'getSettings', environment });
        this.update = createFunction(this, { service: 'settings', handler: 'updateSettings', environment });
        this.request = createFunction(this, {
            service: 'settings',
            handler: 'requestSettings',
            environment,
            initialPolicy: [publishPolicy],
        });

        table.grantReadData(this.get);
        table.grantReadWriteData(this.update);
        table.grantReadData(this.request);
    }
}
