import { z } from 'zod';

type MessageHandler<T extends z.ZodType> = (message: z.output<T>) => Promise<unknown>;

export const defineMessageHandler = <T extends z.ZodType>(schema: T, handler: MessageHandler<T>) => async (event: unknown) => {
    const result = schema.safeParse(event);

    if (!result.success) {
        console.warn('invalid device message:', JSON.stringify(event), z.prettifyError(result.error));

        return;
    }

    await handler(result.data);
};
