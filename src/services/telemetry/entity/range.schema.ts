import { z } from 'zod';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const MAX_RANGE_IN_DAYS = 31;

const instant = z.iso
    .datetime({ offset: true, error: 'must be an RFC 3339 date-time, e.g. 2026-11-17T10:00:00Z' })
    .transform((value) => Date.parse(value))
    .optional();

export const rangeSchema = z
    .object({
        from: instant,
        to: instant,
    })
    .transform(({ from, to }) => {
        const end = to ?? Date.now();

        return { from: from ?? end - DAY_IN_MILLISECONDS, to: end };
    })
    .refine(({ from, to }) => from <= to, { error: 'from must not be after to', path: ['from'] })
    .refine(({ from, to }) => to - from <= MAX_RANGE_IN_DAYS * DAY_IN_MILLISECONDS, {
        error: `range must not exceed ${MAX_RANGE_IN_DAYS} days`,
        path: ['from'],
    });

export type Range = z.output<typeof rangeSchema>;

export const toRangeResponse = ({ from, to }: Range) => ({
    from: new Date(from).toISOString(),
    to: new Date(to).toISOString(),
});
