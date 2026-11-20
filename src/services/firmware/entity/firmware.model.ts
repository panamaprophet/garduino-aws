import { _Object } from '@aws-sdk/client-s3';

export interface Firmware {
    key: string;
    lastModified: Date;
    size: number;
    md5: string;
}

type FirmwareObject = _Object & { Key: string; LastModified: Date; ETag: string };

export const isFirmwareObject = (object: _Object): object is FirmwareObject => {
    return Boolean(object.Key && object.LastModified && object.ETag);
};

export const toFirmware = ({ Key, LastModified, Size, ETag }: FirmwareObject): Firmware => ({
    key: Key,
    lastModified: LastModified,
    size: Size ?? 0,
    md5: ETag.replace(/"/g, ''),
});

export const toFirmwareResponse = ({ key, lastModified, size, md5 }: Firmware) => ({
    key,
    lastModified: lastModified.toISOString(),
    size,
    md5,
});
