import { z } from 'zod';

export const lightSchema = z.object({
    isOn: z.boolean(),
});
