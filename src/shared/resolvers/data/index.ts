import { PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { randomUUID } from 'crypto';
import { client } from '../../providers/db';


export const getControllerEvents = async (controllerId: string, options = { limit: 100 }) => {
    const { Items } = await client.send(new QueryCommand({
        TableName: 'data',
        IndexName: 'controllerIdIndex',
        KeyConditionExpression: '#key = :value',
        ExpressionAttributeNames: { '#key': 'controllerId' },
        ExpressionAttributeValues: { ':value': { S: controllerId } },
        ProjectionExpression: 'ts, event, humidity, temperature, errorMessage',
        ScanIndexForward: false,
        Limit: options.limit,
    }));

    return Items ? Items.map(item => unmarshall(item)) : null;
};

export const getControllerEventsByType = async (controllerId: string, eventType = 'events/update', options = { limit: 100 }) => {
    const { Items } = await client.send(new QueryCommand({
        TableName: 'data',
        IndexName: 'controllerIdIndex',
        KeyConditionExpression: '#key = :value',
        FilterExpression: '#event = :event',
        ExpressionAttributeNames: {
            '#key': 'controllerId',
            '#event': 'event',
        },
        ExpressionAttributeValues: {
            ':value': { S: controllerId },
            ':event': { S: eventType },
        },
        ProjectionExpression: 'ts, event, humidity, temperature, errorMessage',
        ScanIndexForward: false,
        Limit: options.limit,
    }));

    return Items ? Items.map(item => unmarshall(item)) : null;
}

export const addControllerEvent = async (controllerId: string, payload: { [k: string]: any }) => {
    const result = await client.send(new PutItemCommand({
        TableName: 'data',
        Item: marshall({
            ...payload,
            controllerId,
            id: randomUUID(),
            ts: Date.now(),
        }),
    }));

    return result.$metadata.httpStatusCode === 200;
};
