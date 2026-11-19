import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { env } from '@/shared/env';
import { Firmware, toFirmware } from './firmware.model';

const bucket = env('FIRMWARE_BUCKET');

const client = new S3Client({});

export const listFirmware = async () => {
    const firmware: Firmware[] = [];

    let token: string | undefined;

    do {
        const page = await client.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }));
        const items = (page.Contents ?? []).flatMap(toFirmware);

        firmware.push(...items);
        token = page.NextContinuationToken;
    } while (token);

    return firmware.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
};
