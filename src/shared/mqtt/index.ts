import { IoTDataPlaneClient, PublishCommand } from '@aws-sdk/client-iot-data-plane';
import { z } from 'zod';

const client = new IoTDataPlaneClient({});

export const publish = async <T>(topic: string, payload: T) => {
    const body = Buffer.from(JSON.stringify(payload));

    await client.send(new PublishCommand({ topic, payload: body }));

    return payload;
};

export const defineMessageHandler = <T extends z.ZodType>(schema: T, handler: (message: z.output<T>) => Promise<unknown>) => {
    return async (event: unknown) => {
        const result = schema.safeParse(event);

        if (!result.success) {
            console.warn('invalid message:', JSON.stringify(event), z.prettifyError(result.error));

            return null;
        }

        return handler(result.data);
    };
};
