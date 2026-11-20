import { z } from 'zod';

export const fanSchema = z.object({
    speed: z.int().min(0).max(255),
});
