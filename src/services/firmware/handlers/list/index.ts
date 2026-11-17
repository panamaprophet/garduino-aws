import { defineHandler } from '@/lib/http';
import { internalError } from '@/lib/errors';
import { listObjects } from '@/lib/s3';

export const handler = defineHandler(async () => {
    const bucket = process.env.FIRMWARE_BUCKET;

    if (!bucket) {
        throw internalError('Firmware bucket not configured');
    }

    const objects = await listObjects(bucket);

    objects.sort((a, b) => {
        return b.lastModified.getTime() - a.lastModified.getTime();
    });

    return objects.map((item) => ({
        key: item.key,
        lastModified: item.lastModified.getTime(),
        size: item.size,
        md5: item.md5,
    }));
});
