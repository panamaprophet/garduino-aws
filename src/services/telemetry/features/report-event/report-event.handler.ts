import { defineMessageHandler } from '@/shared/mqtt';
import { saveEvent, saveLatestEvent } from '../../entity/event.api';
import { createEvent } from '../../entity/event.model';
import { reportEventSchema } from './report-event.schema';

export const handler = defineMessageHandler(reportEventSchema, async ({ controllerId, receivedAt, payload }) => {
    const event = createEvent(controllerId, receivedAt, payload);
    const saved = await saveEvent(event);

    return saveLatestEvent(saved);
});
