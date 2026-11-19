import { z } from 'zod';
import { rangeSchema } from '../../entity/range.schema';

const MAX_BUCKETS = 1000;

export const intervals = {
    '10m': 10 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
};

export const getSummarySchema = rangeSchema
    .and(z.object({
        interval: z.enum(['10m', '1h', '1d']).default('1h'),
    }))
    .refine(({ from, to, interval }) => (to - from) / intervals[interval] <= MAX_BUCKETS, {
        error: `range must not exceed ${MAX_BUCKETS} intervals`,
        path: ['interval'],
    });

export type SummaryQuery = z.output<typeof getSummarySchema>;
