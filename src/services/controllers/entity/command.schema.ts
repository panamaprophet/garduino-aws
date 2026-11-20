import { z } from 'zod';

export const commandSchema = z.discriminatedUnion('type', [
    z.strictObject({ type: z.literal('reboot') }),
    z.strictObject({ type: z.literal('refresh') }),
    z.strictObject({
        type: z.literal('firmware.update'),
        firmwareKey: z.string().regex(/^[\w.-]+(\/[\w.-]+)*$/, 'Expected a key from the firmware list'),
        md5: z.string().regex(/^[a-f0-9]{32}$/, 'Expected the md5 from the firmware list'),
    }),
]);
