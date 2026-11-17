import { z } from 'zod';

export const settingsRequestSchema = z.object({
    controllerId: z.string().min(1),
});
