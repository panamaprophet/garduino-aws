import { defineHandler } from '@/shared/http';
import { toFirmwareResponse } from '../../entity/firmware.model';
import { listFirmware } from '../../entity/firmware.api';

export const handler = defineHandler(async () => {
    const firmware = await listFirmware();

    return firmware.map(toFirmwareResponse);
});
