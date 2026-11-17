import { defineHandler } from '@/lib/http';
import { internalError, notFoundError, validationError } from '@/lib/errors';
import { getSignedUrl, getObjectHead } from '@/lib/s3';

const isNotFoundError = (error: unknown) => error instanceof Error && error.name === 'NotFound';

export const handler = defineHandler(async (event) => {
    const key = event.queryStringParameters?.key;

    if (!key) {
        throw validationError('Query parameter "key" is required');
    }

    const bucket = process.env.FIRMWARE_BUCKET;

    if (!bucket) {
        throw internalError('Firmware bucket not configured');
    }

    const head = await getObjectHead(bucket, key).catch((error) => {
        throw isNotFoundError(error) ? notFoundError(`Firmware "${key}" not found`) : error;
    });

    const url = await getSignedUrl(bucket, key);
    const md5 = head.ETag?.replace(/"/g, '');

    return { url, md5 };
});
