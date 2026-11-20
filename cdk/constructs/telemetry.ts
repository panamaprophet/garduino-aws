import { Duration } from 'aws-cdk-lib';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { routes, topics } from '@/services/telemetry/telemetry.config';
import { createFunction, createTable, type FunctionProps, type ServiceProps } from '../lib';

export class Telemetry extends Construct {
    constructor(scope: Construct, id: string, { api, mqtt }: ServiceProps) {
        super(scope, id);

        const eventsTable = createTable(this, 'events', {
            partitionKey: { name: 'controllerId', type: AttributeType.STRING },
            sortKey: { name: 'id', type: AttributeType.STRING },
            readCapacity: 8,
            writeCapacity: 2,
        });

        const latestTable = createTable(this, 'latest', {
            partitionKey: { name: 'controllerId', type: AttributeType.STRING },
            sortKey: { name: 'type', type: AttributeType.STRING },
            readCapacity: 1,
            writeCapacity: 1,
        });

        const environment = { EVENTS_TABLE: eventsTable.tableName, LATEST_TABLE: latestTable.tableName };
        const timeout = Duration.seconds(25);

        const createHandler = (feature: string, props?: FunctionProps) => {
            return createFunction(this, { service: 'telemetry', feature, environment, ...props });
        };

        const listEvents = createHandler('list-events', { timeout });
        const getSummary = createHandler('get-summary', { timeout });
        const getLatest = createHandler('get-latest');
        const reportEvent = createHandler('report-event');

        eventsTable.grantReadData(listEvents);
        eventsTable.grantReadData(getSummary);
        latestTable.grantReadData(getLatest);
        eventsTable.grantWriteData(reportEvent);
        latestTable.grantWriteData(reportEvent);

        api.addRoute(routes.listEvents, listEvents);
        api.addRoute(routes.getSummary, getSummary);
        api.addRoute(routes.getLatest, getLatest);

        mqtt.addTopicRule({
            id: 'telemetry',
            topic: topics.telemetry,
            handler: reportEvent,
            select: 'topic(2) AS controllerId, timestamp() AS receivedAt, * AS payload',
            where: "type <> 'connection'",
        });

        const connectionPayload = "{ 'type': 'connection', 'online': eventType = 'connected', 'reason': disconnectReason }";

        mqtt.addTopicRule({
            id: 'connection',
            topic: topics.connection,
            handler: reportEvent,
            select: `clientId AS controllerId, timestamp AS receivedAt, ${connectionPayload} AS payload`,
        });
    }
}
