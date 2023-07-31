import { DeleteItemCommand, GetItemCommand, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { client } from '../../providers/db';
import { getTimeRelativeConfiguration } from '../../helpers';


// @todo: move it to process.env.CONFIGURATIONS_TABLE
const CONFIGURATIONS_TABLE = 'configurations';


const mapConfiguration = (configuration: { [k: string]: any }) => {
    const timerConfiguration = getTimeRelativeConfiguration(configuration.onTime, configuration.duration);

    if (!timerConfiguration) {
        return null;
    }

    return {
        ...timerConfiguration,
        fanSpeed: Number(configuration.fanSpeed),
        thresholdTemperature: Number(configuration.thresholdTemperature),
    };
};

export const getControllerConfigurationRaw = async (controllerId: string) => {
    const { Item } = await client.send(new GetItemCommand({
        TableName: CONFIGURATIONS_TABLE,
        Key: marshall({ controllerId }),
    }));

    return Item ? unmarshall(Item) : null;
};

export const getControllerConfiguration = async (controllerId: string) => {
    const result = await getControllerConfigurationRaw(controllerId);

    return result ? mapConfiguration(result) : null;
};

export const setControllerConfiguration = async (controllerId: string, configuration: { [k: string]: any }) => {
    const result = await client.send(new PutItemCommand({
        TableName: CONFIGURATIONS_TABLE,
        Item: marshall({ controllerId, ...configuration }),
    }));

    return result.$metadata.httpStatusCode === 200;
};

export const removeControllerConfiguration = async (controllerId: string) => {
    const result = await client.send(new DeleteItemCommand({
        TableName: CONFIGURATIONS_TABLE,
        Key: marshall({ controllerId }),
    }))

    return result.$metadata.httpStatusCode === 200;
};

export const getControllerIdsByOwnerId = async (ownerId: string) => {
    const result = await client.send(new QueryCommand({
        TableName: CONFIGURATIONS_TABLE,
        IndexName: 'ownerIdIndex',
        KeyConditionExpression: '#key = :value',
        ExpressionAttributeNames: { '#key': 'ownerId' },
        ExpressionAttributeValues: { ':value': { S: ownerId } },
        ProjectionExpression: 'controllerId',
    }));

    if (!result.Items) {
        return null;
    }

    return result.Items
        .map(item => unmarshall(item))
        .map(item => item.controllerId);
};
