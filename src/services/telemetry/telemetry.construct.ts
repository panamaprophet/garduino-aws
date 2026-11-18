import { Construct } from 'constructs';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { createFunction } from '@cdk/lib/function';
import { ServiceProps } from '@cdk/lib/service';
import { createTable } from '@cdk/lib/table';

export class Telemetry extends Construct {
    constructor(scope: Construct, id: string, { api, mqtt }: ServiceProps) {
        super(scope, id);

        const table = createTable(this, 'events', {
            partitionKey: { name: 'controllerId', type: AttributeType.STRING },
            sortKey: { name: 'sk', type: AttributeType.STRING },
            readCapacity: 8,
            writeCapacity: 2,
        });

        const environment = { EVENTS_TABLE: table.tableName };

        const listEvents = createFunction(this, { service: 'telemetry', feature: 'list-events', environment });
        const ingestEvent = createFunction(this, { service: 'telemetry', feature: 'ingest-event', environment });

        table.grantReadData(listEvents);
        table.grantWriteData(ingestEvent);

        api.addRoute('/v2/controllers/{controllerId}/events', listEvents);

        mqtt.addTopicRule({
            topic: 'controllers/+/events',
            handler: ingestEvent,
            select: 'topic(2) AS controllerId, timestamp() AS receivedAt, * AS payload',
        });
    }
}
