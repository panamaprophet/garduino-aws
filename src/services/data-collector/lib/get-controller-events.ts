import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { client } from '@/lib/db';

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
        TableName: String(process.env.DATA_TABLE),
        IndexName: 'controllerId_Index',
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
        ProjectionExpression: 'ts, humidity, temperature, fanSpeed, event, isOn',
        ScanIndexForward: false,
        Limit: limit,
    }));

    return Items ? Items.map(item => unmarshall(item)) : null;
};
