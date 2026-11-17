import { z } from 'zod';

const timestamp = z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.coerce
        .number({ error: 'must be a Unix timestamp in milliseconds' })
        .int({ error: 'must be a Unix timestamp in milliseconds' })
        .nonnegative({ error: 'must be a Unix timestamp in milliseconds' })
        .optional(),
);

export const eventsQuerySchema = z
    .object({
        startDate: timestamp,
        endDate: timestamp,
    })
    .refine(
        ({ startDate, endDate }) => startDate === undefined || endDate === undefined || startDate <= endDate,
        { error: 'startDate must not be after endDate', path: ['startDate'] },
    );
