import { PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { DeleteItemCommand, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { client as ws } from '../../api-gateway-management-api';
import { client as db } from '../../db';

export const sendMessage = async (connectionId: string, message: any) => {
    return ws.send(new PostToConnectionCommand({
        ConnectionId: connectionId,
        // @ts-ignore: figure out why
        Data: JSON.stringify(message),
    }));
};

export const storeConnection = async (connectionId: string, clientId: string) => {
    const result = await db.send(new PutItemCommand({
        TableName: 'connections',
        Item: marshall({ connectionId, clientId })
    }));

    return result.$metadata.httpStatusCode === 200;
};

export const removeConnection = async (connectionId: string) => {
    const result = await db.send(new DeleteItemCommand({
        TableName: 'connections',
        Key: marshall({ connectionId }),
    }));

    return result.$metadata.httpStatusCode === 200;
};

export const getConnectionId = async (clientId: string): Promise<string | null> => {
    const params = {
        TableName: 'connections',
        IndexName: 'clientIdIndex',
        KeyConditionExpression: '#key = :value',
        ExpressionAttributeNames: { '#key': 'clientId' },
        ExpressionAttributeValues: { ':value': { S: clientId } },
    };

    const { Items } = await db.send(new QueryCommand(params));

    if (!Items || !Items.length) {
        return null;
    }

    const [result] = Items;
    const { connectionId } = unmarshall(result!);

    return connectionId;
};
