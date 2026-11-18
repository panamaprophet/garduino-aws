import { z } from 'zod';

export const requestSettingsSchema = z.object({
    controllerId: z.string().min(1),
});
