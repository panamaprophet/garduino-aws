import type { z } from 'zod';
import type { commandSchema } from './command.schema';

export type Command = z.output<typeof commandSchema>;

export const toDeviceCommand = (command: Command, firmwareBaseUrl: string) => {
    if (command.type !== 'firmware.update') {
        return { v: 2, ...command };
    }

    const { firmwareKey, ...rest } = command;
    const url = `${firmwareBaseUrl}/${encodeURI(firmwareKey)}`;

    return { v: 2, ...rest, url };
};
