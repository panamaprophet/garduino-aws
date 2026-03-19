import { APIGatewayProxyEventBase } from 'aws-lambda';
import { handleResponse } from '@/lib/response';
import { listObjects } from '@/lib/s3';

export const handler = async (event: APIGatewayProxyEventBase<unknown>) => {
    const bucket = process.env.FIRMWARE_BUCKET;

    if (!bucket) {
        return handleResponse({ error: 'Firmware bucket not configured' }, 500);
    }

    const objects = await listObjects(bucket);

    objects.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

    const files = objects.map((item) => ({
        key: item.key,
        lastModified: item.lastModified.getTime(),
        size: item.size,
        md5: item.md5,
    }));

    return handleResponse(files);
};
