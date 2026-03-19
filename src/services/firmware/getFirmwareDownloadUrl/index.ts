import { APIGatewayProxyEventBase } from 'aws-lambda';
import { handleResponse } from '@/shared/helpers';
import { getSignedUrl, getObjectHead } from '@/shared/services/s3';

export const handler = async (event: APIGatewayProxyEventBase<unknown>) => {
    const key = event.queryStringParameters?.key;

    if (!key) {
        return handleResponse({ error: 'Query parameter "key" is required' }, 400);
    }

    const bucket = process.env.FIRMWARE_BUCKET;

    if (!bucket) {
        return handleResponse({ error: 'Firmware bucket not configured' }, 500);
    }

    const url = await getSignedUrl(bucket, key);
    const head = await getObjectHead(bucket, key);

    const md5 = head.ETag?.replace(/"/g, '');

    return handleResponse({ url, md5 });
};
