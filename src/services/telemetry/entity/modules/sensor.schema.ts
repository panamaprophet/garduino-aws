import { z } from 'zod';

export const sensorSchema = z.union([
    z.object({
        temperature: z.number(),
        humidity: z.number(),
        stabilityFactor: z.number(),
    }),
    z.object({
        error: z.string(),
    }),
]);
