import { query } from '@/lib/db';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

interface Options {
    limit: number;
    startDate: number | string;
    endDate: number | string;
}

interface ControllerEvent {
    ts: number;
    humidity: number;
    temperature: number;
    fanSpeed: number;
    event: string;
    isOn: boolean;
}

export const getControllerEvents = async (controllerId: string, options: Partial<Options>) => {
    const startDate = options.startDate || (Date.now() - DAY_IN_MILLISECONDS);
    const endDate = options.endDate || Date.now();

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
            projection: ['ts', 'humidity', 'temperature', 'fanSpeed', 'event', 'isOn'],
            index: 'controllerId_Index',
            limit: options.limit,
            scanForward: false,
        }
    );
};
