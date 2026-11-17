import { z } from 'zod';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export const lightSchema = z.object({
    onTime: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: 'must be a local time of day in HH:mm format' }),
    durationMs: z
        .number()
        .int()
        .min(0)
        .max(DAY_IN_MILLISECONDS, { error: 'must not exceed 24 hours (86400000 ms)' }),
});

export type Light = z.output<typeof lightSchema>;

export const lightDefaults: Light = {
    onTime: '12:00',
    durationMs: 12 * 60 * 60 * 1000,
};
