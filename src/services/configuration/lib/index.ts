import { randomUUID, UUID } from 'crypto';
import { get, put, remove, query } from '@/lib/db';
import { getTimeRelativeConfiguration } from '@/lib/time';

interface Configuration {
    ownerId: UUID;
    onTime: `${number}:${number}`;
    duration: number;
    thresholdTemperature: number;
    fanSpeed: number;
}

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
    return get<Configuration>(process.env.CONFIGURATION_TABLE, { controllerId });
};

export const getControllerConfiguration = async (controllerId: string) => {
    const result = await getControllerConfigurationRaw(controllerId);

    return result ? mapConfiguration(result) : null;
};

export const setControllerConfiguration = async (controllerId: string, configuration: Configuration) => {
    return put(process.env.CONFIGURATION_TABLE, { controllerId, ...configuration });
};

export const removeControllerConfiguration = async (controllerId: string) => {
    return remove(process.env.CONFIGURATION_TABLE, { controllerId });
};

export const getControllerIdsByOwnerId = async (ownerId: string) => {
    const result = await query<{ controllerId: string }>(
        process.env.CONFIGURATION_TABLE,
        '#ownerId = :ownerId',
        {
            attributes: {
                '#ownerId': 'ownerId',
                ':ownerId': ownerId,
            },
            projection: ['controllerId'],
            index: 'ownerId_Index',
        }
    );

    if (!result) {
        return null;
    }

    return result.map(item => item.controllerId);
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
