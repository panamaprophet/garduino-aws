import { z } from 'zod';

export const eventMessageSchema = z.object({
    controllerId: z.string().min(1),
    receivedAt: z.number().int().nonnegative(),
    payload: z.looseObject({
        type: z.string().min(1),
    }),
});
