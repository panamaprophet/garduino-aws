import { z } from 'zod';

export const controllerSchema = z.strictObject({
    name: z.string().trim().min(1).max(64),
});
