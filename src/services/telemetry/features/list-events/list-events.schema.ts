import { z } from 'zod';
import { fromCursor } from '@/shared/cursor';
import { rangeSchema } from '../../entity/range.schema';

const orderSchema = z.enum(['asc', 'desc']).default('desc');

const limitSchema = z.coerce.number().int().min(1).max(1000).default(100);

const cursorSchema = z
    .string()
    .transform(fromCursor)
    .pipe(z.object({
        from: z.number(),
        to: z.number(),
        order: orderSchema,
        limit: limitSchema,
        types: z.array(z.string()),
        lastKey: z.string(),
    }, { error: 'must be a cursor returned by a previous page' }));

export const listEventsSchema = rangeSchema
    .and(z.object({
        order: orderSchema,
        limit: limitSchema,
        types: z.string().optional().transform((value) => value?.split(',') ?? []),
        cursor: cursorSchema.optional(),
    }))
    .transform(({ cursor, ...query }) => cursor ?? query);
