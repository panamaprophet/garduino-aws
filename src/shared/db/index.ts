import { ConditionalCheckFailedException, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { env } from '@/shared/env';

type Item = Record<string, unknown>;

interface PutOptions {
    condition: string;
    values?: Item;
}

export interface QueryOptions {
    index?: string;
    filter?: string;
    limit?: number;
    order?: 'asc' | 'desc';
    startKey?: Item;
}

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
    marshallOptions: { removeUndefinedValues: true },
});

const toNames = (...expressions: Array<string | undefined>) => {
    const placeholders = expressions.join(' ').match(/#\w+/g) ?? [];
    const entries = placeholders.map((placeholder) => [placeholder, placeholder.slice(1)]);

    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

export const table = <T extends object>(envName: string) => {
    const name = env(envName);

    const get = async (key: Item) => {
        const { Item } = await client.send(new GetCommand({ TableName: name, Key: key }));

        return Item ? Item as T : null;
    };

    const put = async (item: T, options?: PutOptions) => {
        const command = new PutCommand({
            TableName: name,
            Item: item as Item,
            ConditionExpression: options?.condition,
            ExpressionAttributeNames: toNames(options?.condition),
            ExpressionAttributeValues: options?.values,
        });

        try {
            await client.send(command);

            return item;
        } catch (error) {
            if (error instanceof ConditionalCheckFailedException) {
                return null;
            }

            throw error;
        }
    };

    const remove = async (key: Item) => {
        const { Attributes } = await client.send(new DeleteCommand({ TableName: name, Key: key, ReturnValues: 'ALL_OLD' }));

        return Attributes ? Attributes as T : null;
    };

    const query = async (condition: string, values: Item, options: QueryOptions = {}) => {
        const { Items, LastEvaluatedKey } = await client.send(new QueryCommand({
            TableName: name,
            IndexName: options.index,
            KeyConditionExpression: condition,
            FilterExpression: options.filter,
            ExpressionAttributeNames: toNames(condition, options.filter),
            ExpressionAttributeValues: values,
            Limit: options.limit,
            ScanIndexForward: options.order !== 'desc',
            ExclusiveStartKey: options.startKey,
        }));

        return { items: (Items ?? []) as T[], lastKey: LastEvaluatedKey };
    };

    const queryAll = async (condition: string, values: Item, options: QueryOptions = {}) => {
        const items: T[] = [];

        let startKey = options.startKey;

        do {
            const page = await query(condition, values, { ...options, startKey });

            items.push(...page.items);
            startKey = page.lastKey;
        } while (startKey);

        return items;
    };

    return { get, put, remove, query, queryAll };
};
