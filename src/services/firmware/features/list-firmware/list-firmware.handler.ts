import { defineHandler } from '@/shared/http';
import { listFirmware } from '../../entity/firmware.api';
import { toFirmwareResponse } from '../../entity/firmware.model';

export const handler = defineHandler({}, async () => {
    const firmware = await listFirmware();

    const data = firmware.map(toFirmwareResponse);

    return { data };
});
