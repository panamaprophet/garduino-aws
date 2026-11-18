export interface Firmware {
    key: string;
    lastModified: Date;
    size: number;
    md5: string;
}

export const toFirmwareResponse = ({ key, lastModified, size, md5 }: Firmware) => ({
    key,
    lastModified: lastModified.toISOString(),
    size,
    md5,
});
