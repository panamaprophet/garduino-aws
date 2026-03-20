import { DeleteItemCommand, GetItemCommand, PutItemCommand, QueryCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({});

interface QueryOptions {
    attributes: Record<string, unknown>;
    index?: string;
    projection?: string[];
    limit?: number;
    scanForward?: boolean;
}

const extractExpressionAttributes = (attributes: Record<string, unknown>) => {
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(attributes)) {
        if (key.startsWith('#')) {
            names[key] = String(value);
        }

        if (key.startsWith(':')) {
            values[key] = value;
        }
    }

    return { names, values: marshall(values) };
};

export const get = async <T>(table: string | undefined, key: Record<string, unknown>) => {
    const { Item } = await client.send(new GetItemCommand({
        TableName: table,
        Key: marshall(key),
    }));

    return Item ? unmarshall(Item) as T : null;
};

export const put = async (table: string | undefined, data: Record<string, unknown>)=> {
    const result = await client.send(new PutItemCommand({
        TableName: table,
        Item: marshall(data),
    }));

    return result.$metadata.httpStatusCode === 200;
};

export const remove = async (table: string | undefined, key: Record<string, unknown>)=> {
    const result = await client.send(new DeleteItemCommand({
        TableName: table,
        Key: marshall(key),
    }));

    return result.$metadata.httpStatusCode === 200;
};

export const query = async <T>(table: string | undefined, expression: string, options: QueryOptions) => {
    const { names, values } = extractExpressionAttributes(options.attributes);

    const { Items } = await client.send(new QueryCommand({
        TableName: table,
        KeyConditionExpression: expression,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        IndexName: options.index,
        ProjectionExpression: options.projection?.join(', '),
        Limit: options.limit,
        ScanIndexForward: options.scanForward,
    }));

    return Items ? Items.map(item => unmarshall(item) as T) : null;
};
