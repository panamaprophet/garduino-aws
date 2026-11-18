import { randomUUID } from 'crypto';
import { defineMessageHandler } from '@/shared/device';
import { saveEvent } from '../../entity/event.api';
import { reportEventSchema } from './report-event.schema';

export const handler = defineMessageHandler(reportEventSchema, ({ controllerId, receivedAt, payload }) => {
    const { type, ...data } = payload;

    return saveEvent({
        controllerId,
        id: randomUUID(),
        type,
        ts: receivedAt,
        data,
    });
});
