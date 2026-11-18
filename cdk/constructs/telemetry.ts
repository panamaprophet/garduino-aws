import { Construct } from 'constructs';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { createFunction } from '../lib/function';
import { ServiceProps } from '../lib/service';
import { createTable } from '../lib/table';
import { routes, topics } from '@/services/telemetry/telemetry.config';

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
        const reportEvent = createFunction(this, { service: 'telemetry', feature: 'report-event', environment });

        table.grantReadData(listEvents);
        table.grantWriteData(reportEvent);

        api.addRoute(routes.listEvents, listEvents);

        mqtt.addTopicRule({
            topic: topics.events,
            handler: reportEvent,
            select: 'topic(2) AS controllerId, timestamp() AS receivedAt, * AS payload',
        });
    }
}
