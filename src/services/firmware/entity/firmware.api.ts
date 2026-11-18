import { internalError } from '@/shared/errors';
import { listObjects } from '@/shared/s3';
import { Firmware } from './firmware.model';

export const listFirmware = async (): Promise<Firmware[]> => {
    const bucket = process.env.FIRMWARE_BUCKET;

    if (!bucket) {
        throw internalError('Firmware bucket not configured');
    }

    const objects = await listObjects(bucket);

    return objects.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
};
