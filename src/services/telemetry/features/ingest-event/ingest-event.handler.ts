import { randomUUID } from 'crypto';
import { defineMessageHandler } from '@/shared/device';
import { saveEvent } from '../../entity/event.repository';
import { ingestEventSchema } from './ingest-event.schema';

export const handler = defineMessageHandler(ingestEventSchema, ({ controllerId, receivedAt, payload }) => {
    const { type, ...data } = payload;

    return saveEvent({
        controllerId,
        id: randomUUID(),
        type,
        ts: receivedAt,
        data,
    });
});
