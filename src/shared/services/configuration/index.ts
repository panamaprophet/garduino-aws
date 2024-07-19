import { randomUUID, UUID } from 'crypto';
import { DeleteItemCommand, GetItemCommand, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { client } from '@/shared/services/db';
import { getTimeRelativeConfiguration } from '@/shared/helpers';

interface Configuration {
    ownerId: UUID;
    onTime: `${number}:${number}`;
    duration: number;
    thresholdTemperature: number;
    fanSpeed: number;
}

const CONFIGURATION_TABLE = process.env.CONFIGURATION_TABLE;

const mapConfiguration = (configuration: Configuration) => {
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
        TableName: CONFIGURATION_TABLE,
        Key: marshall({ controllerId }),
    }));

    return Item ? unmarshall(Item) as Configuration : null;
};

export const getControllerConfiguration = async (controllerId: string) => {
    const result = await getControllerConfigurationRaw(controllerId);

    return result ? mapConfiguration(result) : null;
};

export const setControllerConfiguration = async (controllerId: string, configuration: Configuration) => {
    const result = await client.send(new PutItemCommand({
        TableName: CONFIGURATION_TABLE,
        Item: marshall({ controllerId, ...configuration }),
    }));

    return result.$metadata.httpStatusCode === 200;
};

export const removeControllerConfiguration = async (controllerId: string) => {
    const result = await client.send(new DeleteItemCommand({
        TableName: CONFIGURATION_TABLE,
        Key: marshall({ controllerId }),
    }))

    return result.$metadata.httpStatusCode === 200;
};

export const getControllerIdsByOwnerId = async (ownerId: string) => {
    const result = await client.send(new QueryCommand({
        TableName: CONFIGURATION_TABLE,
        IndexName: 'ownerId_Index',
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

export const createConfiguration = async (controllerId: UUID, props: Partial<Configuration>) => {
    const configuration: Configuration = {
        ownerId: randomUUID(),
        onTime: '12:00',
        duration: 43200000,
        thresholdTemperature: 30,
        fanSpeed: 125,
        ...props,
    };

    await setControllerConfiguration(controllerId, configuration);

    return { controllerId, ...configuration };
};
