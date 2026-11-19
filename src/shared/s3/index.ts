import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';

const client = new S3Client({});

export const listObjects = async (bucket: string, prefix?: string) => {
    const result: Array<{
        key: string;
        lastModified: Date;
        size: number;
        md5: string;
    }> = [];

    let continuationToken: string | undefined;

    do {
        const response = await client.send(new ListObjectsV2Command({
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
