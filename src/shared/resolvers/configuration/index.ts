import { GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { client } from '../../db';
import { getTimeRelativeConfiguration } from '../../helpers';


// @todo: move it to process.env.CONFIGURATIONS_TABLE
const CONFIGURATIONS_TABLE = 'configurations';


const mapConfiguration = (configuration: { [k: string]: any }) => {
    const timerConfiguration = getTimeRelativeConfiguration(
        configuration.onTime,
        configuration.duration
    );

    if (!timerConfiguration) {
        return null;
    }

    return {
        ...timerConfiguration,
        fanSpeed: Number(configuration.fanSpeed),
        thresholdTemperature: Number(configuration.thresholdTemperature),
    };
};


export const getControllerConfiguration = async (controllerId: string) => {
    const { Item } = await client.send(new GetItemCommand({
        TableName: CONFIGURATIONS_TABLE,
        Key: marshall({ controllerId }),
    }));

    return Item ? mapConfiguration(unmarshall(Item)) : null;
};

export const setControllerConfiguration = async (controllerId: string, configuration: { [k: string]: any }) => {
    const result = await client.send(new PutItemCommand({
        TableName: CONFIGURATIONS_TABLE,
        Item: marshall({ controllerId, ...configuration }),
    }));

    return result.$metadata.httpStatusCode === 200;
};
