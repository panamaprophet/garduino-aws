import { z } from 'zod';

export const fanSchema = z.object({
    defaultSpeed: z.number().int().min(0).max(255),
});

export type Fan = z.output<typeof fanSchema>;

export const fanDefaults: Fan = {
    defaultSpeed: 125,
};
