export type Command =
    | { type: 'reboot' }
    | { type: 'refresh' }
    | { type: 'firmware.update'; firmwareKey: string; md5: string };

export const toDeviceCommand = (command: Command, firmwareBaseUrl: string) => {
    if (command.type === 'firmware.update') {
        return {
            v: 2,
            type: command.type,
            url: `${firmwareBaseUrl}/${encodeURI(command.firmwareKey)}`,
            md5: command.md5,
        };
    }

    return { v: 2, type: command.type };
};
