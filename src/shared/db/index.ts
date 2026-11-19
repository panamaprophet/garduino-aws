import {
    ConditionalCheckFailedException,
    DeleteItemCommand,
    DynamoDBClient,
    GetItemCommand,
    PutItemCommand,
    QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({});

type Key = Record<string, unknown>;

interface QueryOptions {
    attributes: Record<string, unknown>;
    index?: string;
    projection?: string[];
    limit?: number;
    scanForward?: boolean;
    startKey?: Key;
}

interface PutOptions {
    condition: string;
    attributes: Record<string, unknown>;
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

    return {
        names: Object.keys(names).length > 0 ? names : undefined,
        values: Object.keys(values).length > 0 ? marshall(values) : undefined,
    };
};

export const get = async <T>(table: string | undefined, key: Key) => {
    const { Item } = await client.send(new GetItemCommand({
        TableName: table,
        Key: marshall(key),
    }));

    return Item ? unmarshall(Item) as T : null;
};

export const put = async (table: string | undefined, data: Record<string, unknown>, options?: PutOptions) => {
    const { names, values } = extractExpressionAttributes(options?.attributes ?? {});

    try {
        await client.send(new PutItemCommand({
            TableName: table,
            Item: marshall(data, { removeUndefinedValues: true }),
            ConditionExpression: options?.condition,
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: values,
        }));

        return true;
    } catch (error) {
        if (error instanceof ConditionalCheckFailedException) {
            return false;
        }

        throw error;
    }
};

export const remove = async (table: string | undefined, key: Key) => {
    const result = await client.send(new DeleteItemCommand({
        TableName: table,
        Key: marshall(key),
    }));

    return result.$metadata.httpStatusCode === 200;
};

export const query = async <T>(table: string | undefined, expression: string, options: QueryOptions) => {
    const { names, values } = extractExpressionAttributes(options.attributes);

    const { Items, LastEvaluatedKey } = await client.send(new QueryCommand({
        TableName: table,
        KeyConditionExpression: expression,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        IndexName: options.index,
        ProjectionExpression: options.projection?.join(', '),
        Limit: options.limit,
        ScanIndexForward: options.scanForward,
        ExclusiveStartKey: options.startKey ? marshall(options.startKey) : undefined,
    }));

    return {
        items: (Items ?? []).map((item) => unmarshall(item) as T),
        lastKey: LastEvaluatedKey ? unmarshall(LastEvaluatedKey) : undefined,
    };
};

export const queryAll = async <T>(table: string | undefined, expression: string, options: QueryOptions) => {
    const items: T[] = [];

    let startKey = options.startKey;

    do {
        const page = await query<T>(table, expression, { ...options, startKey });

        items.push(...page.items);
        startKey = page.lastKey;
    } while (startKey);

    return items;
};
