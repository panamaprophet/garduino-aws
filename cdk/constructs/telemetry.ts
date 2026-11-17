import { Construct } from 'constructs';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { createFunction } from '../lib/function';
import { createTable } from '../lib/table';

export class Telemetry extends Construct {
    readonly listEvents: NodejsFunction;
    readonly ingestEvent: NodejsFunction;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const table = createTable(this, 'events', {
            partitionKey: { name: 'controllerId', type: AttributeType.STRING },
            sortKey: { name: 'sk', type: AttributeType.STRING },
            readCapacity: 8,
            writeCapacity: 2,
        });

        const environment = { EVENTS_TABLE: table.tableName };

        this.listEvents = createFunction(this, { service: 'telemetry', handler: 'listEvents', environment });
        this.ingestEvent = createFunction(this, { service: 'telemetry', handler: 'ingestEvent', environment });

        table.grantReadData(this.listEvents);
        table.grantWriteData(this.ingestEvent);
    }
}
