import { z } from 'zod';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export const configurationSchema = z.object({
    onTime: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: 'must be a time of day in HH:mm format (UTC)' })
        .transform((value) => value as `${number}:${number}`),
    duration: z
        .number()
        .min(0)
        .max(DAY_IN_MILLISECONDS, { error: 'must not exceed 24 hours (86400000 ms)' })
        .transform(Math.round),
    thresholdTemperature: z.number().int().min(0).max(100),
    fanSpeed: z.number().int().min(0).max(255),
}).partial();
