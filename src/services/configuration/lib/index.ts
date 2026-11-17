import { randomUUID, UUID } from 'crypto';
import { get, put, remove, query } from '@/lib/db';
import { notFoundError } from '@/lib/errors';
import { getTimeRelativeConfiguration } from '@/lib/time';

interface Configuration {
    ownerId: UUID;
    onTime: `${number}:${number}`;
    duration: number;
    thresholdTemperature: number;
    fanSpeed: number;
}

export type StoredConfiguration = Configuration & { controllerId: string };

export type ConfigurationInput = Partial<Omit<Configuration, 'ownerId'>>;

export const mapConfiguration = (configuration: Configuration) => {
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
    return get<StoredConfiguration>(process.env.CONFIGURATION_TABLE, { controllerId });
};

export const getControllerConfiguration = async (controllerId: string) => {
    const result = await getControllerConfigurationRaw(controllerId);

    return result ? mapConfiguration(result) : null;
};

export const requireController = async (controllerId: string, userId: string) => {
    const configuration = await getControllerConfigurationRaw(controllerId);

    if (!configuration || configuration.ownerId !== userId) {
        throw notFoundError(`Controller "${controllerId}" not found`);
    }

    return configuration;
};

export const setControllerConfiguration = async (controllerId: string, configuration: Configuration) => {
    return put(process.env.CONFIGURATION_TABLE, { controllerId, ...configuration });
};

export const updateControllerConfiguration = async (current: StoredConfiguration, input: ConfigurationInput) => {
    const next: StoredConfiguration = {
        ...current,
        ...input,
        controllerId: current.controllerId,
        ownerId: current.ownerId,
    };

    await put(process.env.CONFIGURATION_TABLE, { ...next });

    return next;
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
