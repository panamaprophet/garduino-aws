import { randomUUID } from 'crypto';
import { defineMessageHandler } from '@/lib/device';
import { saveEvent } from '../../store/events';
import { eventMessageSchema } from './event-message.schema';

export const handler = defineMessageHandler(eventMessageSchema, ({ controllerId, receivedAt, payload }) => {
    const { type, ...data } = payload;

    return saveEvent({
        controllerId,
        id: randomUUID(),
        type,
        ts: receivedAt,
        data,
    });
});
