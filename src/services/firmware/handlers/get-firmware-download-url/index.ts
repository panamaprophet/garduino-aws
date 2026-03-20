import { APIGatewayProxyEventBase } from 'aws-lambda';
import { getSignedUrl, getObjectHead } from '@/lib/s3';

export const handler = async (event: APIGatewayProxyEventBase<unknown>) => {
    const key = event.queryStringParameters?.key;

    if (!key) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Query parameter "key" is required' }),
        };
    }

    const bucket = process.env.FIRMWARE_BUCKET;

    if (!bucket) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Firmware bucket not configured' }),
        };
    }

    const url = await getSignedUrl(bucket, key);
    const head = await getObjectHead(bucket, key);

    const md5 = head.ETag?.replace(/"/g, '');

    return { url, md5 };
};
