import { _Object } from '@aws-sdk/client-s3';

export interface Firmware {
    key: string;
    lastModified: Date;
    size: number;
    md5: string;
}

export const toFirmware = ({ Key, LastModified, Size, ETag }: _Object): Firmware[] => {
    if (!Key || !LastModified || !ETag) {
        return [];
    }

    return [{ key: Key, lastModified: LastModified, size: Size ?? 0, md5: ETag.replace(/"/g, '') }];
};

export const toFirmwareResponse = ({ key, lastModified, size, md5 }: Firmware) => ({
    key,
    lastModified: lastModified.toISOString(),
    size,
    md5,
});
