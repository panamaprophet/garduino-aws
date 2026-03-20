import { APIGatewayProxyEventBase } from 'aws-lambda';
import { listObjects } from '@/lib/s3';

export const handler = async (event: APIGatewayProxyEventBase<unknown>) => {
    const bucket = process.env.FIRMWARE_BUCKET;

    if (!bucket) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Firmware bucket not configured' }),
        };
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
};
