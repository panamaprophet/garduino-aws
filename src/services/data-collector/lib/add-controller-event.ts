import { randomUUID } from 'crypto';
import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { client } from '@/lib/db';

export const addControllerEvent = async (controllerId: string, payload: { [k: string]: any }) => {
    const result = await client.send(new PutItemCommand({
        TableName: String(process.env.DATA_TABLE),
        Item: marshall({
            ...payload,
            controllerId,
            id: randomUUID(),
            ts: Date.now(),
        }),
    }));

    return result.$metadata.httpStatusCode === 200;
};
