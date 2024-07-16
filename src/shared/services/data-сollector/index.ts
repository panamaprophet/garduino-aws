import { PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { randomUUID } from 'crypto';
import { client } from '../db';


const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

interface Options {
    limit: number;
    startDate: number | string;
    endDate: number | string;
}

export const getControllerEvents = async (controllerId: string, options: Partial<Options>) => {
    const startDate = options.startDate || (Date.now() - DAY_IN_MILLISECONDS);
    const endDate = options.endDate || Date.now();
    const limit = options.limit;

    const { Items } = await client.send(new QueryCommand({
        TableName: 'data',
        IndexName: 'controllerIdIndex',
        KeyConditionExpression: '#key = :value AND #ts BETWEEN :startDate AND :endDate',
        ExpressionAttributeNames: {
            '#key': 'controllerId',
            '#ts': 'ts',
        },
        ExpressionAttributeValues: {
            ':value': { S: controllerId },
            ':startDate': { N: String(startDate) },
            ':endDate': { N: String(endDate) },
        },
        ProjectionExpression: 'ts, humidity, temperature, event, isOn',
        ScanIndexForward: false,
        Limit: limit,
    }));

    return Items ? Items.map(item => unmarshall(item)) : null;
};

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
