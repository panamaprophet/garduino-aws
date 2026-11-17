import { query } from '@/lib/db';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

interface Options {
    startDate?: number;
    endDate?: number;
    limit?: number;
}

interface ControllerEvent {
    ts: number;
    fan: {
        currentSpeed: number;
    };
    light: {
        isOn: boolean;
    };
    sensor: {
        temperature: number;
        humidity: number;
        stabilityFactor: number;
    };
    event: string;
}

export const getControllerEvents = async (controllerId: string, options: Options = {}) => {
    const endDate = options.endDate ?? Date.now();
    const startDate = options.startDate ?? (endDate - DAY_IN_MILLISECONDS);

    return query<ControllerEvent>(
        process.env.DATA_TABLE,
        '#controllerId = :controllerId AND #ts BETWEEN :startDate AND :endDate',
        {
            attributes: {
                '#controllerId': 'controllerId',
                ':controllerId': controllerId,
                '#ts': 'ts',
                ':startDate': startDate,
                ':endDate': endDate,
            },
            index: 'controllerId_Index',
            limit: options.limit,
            scanForward: false,
        }
    );
};
