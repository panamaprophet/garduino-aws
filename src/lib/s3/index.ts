import { GetObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { S3Client } from '@aws-sdk/client-s3';
import * as s3RequestPresigner from '@aws-sdk/s3-request-presigner';

export const s3Client = new S3Client({});

export const listObjects = async (bucket: string, prefix?: string) => {
    const result: Array<{
        key: string;
        lastModified: Date;
        size: number;
        md5: string;
    }> = [];

    let continuationToken: string | undefined;

    do {
        const response = await s3Client.send(new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken,
        }));

        response.Contents?.forEach((item) => {
            if (!item.Key || !item.LastModified || !item.ETag) {
                return;
            }

            result.push({
                key: item.Key,
                lastModified: item.LastModified,
                size: item.Size ?? 0,
                md5: item.ETag.replace(/"/g, ''),
            });
        });

        continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return result;
};

export const getSignedUrl = async (
    bucket: string,
    key: string,
    expiresIn = 3600,
) => {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });

    return s3RequestPresigner.getSignedUrl(s3Client, command, { expiresIn });
};

export const getObjectHead = async (bucket: string, key: string) => {
    const command = new HeadObjectCommand({ Bucket: bucket, Key: key });

    const response = await s3Client.send(command);

    return response;
};
