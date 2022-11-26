import { PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { randomUUID } from 'crypto';
import { client } from '../../providers/db';


export const getControllerData = async (controllerId: string) => {
    const { Items } = await client.send(new QueryCommand({
        TableName: 'data',
        IndexName: 'controllerIdIndex',
        KeyConditionExpression: '#key = :value',
        ExpressionAttributeNames: { '#key': 'controllerId' },
        ExpressionAttributeValues: { ':value': { S: controllerId } },
    }));

    return Items ? Items.map(item => unmarshall(item)) : null;
};

export const addControllerData = async (controllerId: string, payload: { [k: string]: any }) => {
    const result = await client.send(new PutItemCommand({
        TableName: 'data',
        Item: marshall({
            ...payload,
            controllerId,
            id: randomUUID(),
            timestamp: Date.now(),
        }),
    }));

    return result.$metadata.httpStatusCode === 200;
};
