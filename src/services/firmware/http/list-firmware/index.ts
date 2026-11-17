import { defineHandler } from '@/lib/http';
import { internalError } from '@/lib/errors';
import { listObjects } from '@/lib/s3';

export const handler = defineHandler(async () => {
    const bucket = process.env.FIRMWARE_BUCKET;

    if (!bucket) {
        throw internalError('Firmware bucket not configured');
    }

    const objects = await listObjects(bucket);

    return objects
        .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
        .map((item) => ({
            key: item.key,
            lastModified: item.lastModified.toISOString(),
            size: item.size,
            md5: item.md5,
        }));
});
